import {authenticated,createSession,clearSession,verifyPassword,loginLimit,resetLoginLimit} from './auth.js';
import {HttpError,assertId,assertType,canonicalId,sanitize,types,createRepository} from './content.js';
import {fields,getValue} from '../public/schema.js';

const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers}});
const headers={
  'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',
  'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' https://cdn.sanity.io blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'none'",
  'Permissions-Policy':'camera=(), microphone=(), geolocation=()',
};
async function readBody(request,limit) {
  if (Number(request.headers.get('content-length')||0)>limit) throw new HttpError(413,'Filen eller texten är för stor.');
  const reader=request.body?.getReader(); if (!reader) return new Uint8Array();
  const chunks=[]; let size=0;
  while (true) {const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit){await reader.cancel();throw new HttpError(413,'Filen eller texten är för stor.');}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}return bytes;
}
async function bodyJson(request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new HttpError(415,'Förfrågan behöver skickas som JSON.');
  try {return JSON.parse(new TextDecoder().decode(await readBody(request,1024*1024)));} catch(error) {if(error instanceof HttpError)throw error;throw new HttpError(400,'Förfrågan kunde inte läsas.');}
}
function stripMetadata(doc) {return Object.fromEntries(Object.entries(doc).filter(([key])=>!key.startsWith('_')));}
function guardType(doc) {if (!doc || !types.includes(doc._type)) throw new HttpError(404,'Innehållet hittades inte.');return doc;}
function requireRevision(doc,revision) {if (!revision || doc._rev!==revision) throw new HttpError(409,'Innehållet har ändrats sedan du öppnade det. Ladda om innan du sparar.');}

async function references(repo,type,doc,strict) {
  const targets=[];
  for(const field of fields[type]) if(['sport','photo','album'].includes(field.kind)) {const value=getValue(doc,field.path);if(value)targets.push({ref:value,type:field.kind});}
  for(const value of doc.photos||[]) targets.push({ref:value,type:'photo'});
  if(doc.image?.asset) targets.push({ref:doc.image.asset,type:'sanity.imageAsset'});
  if(!targets.length)return;
  const ids=[...new Set(targets.flatMap(t=>[t.ref._ref,`drafts.${t.ref._ref}`]))];
  const known=await repo.query('*[_id in $ids]{_id,_type}',{ids});
  for(const {ref,type:targetType} of targets) {
    const published=known.find(d=>d._id===ref._ref&&d._type===targetType);
    const draft=known.find(d=>d._id===`drafts.${ref._ref}`&&d._type===targetType);
    if(!published&&!draft)throw new HttpError(400,'En vald bild, sport eller ett album finns inte längre. Välj ett annat.');
    if(strict&&!published)throw new HttpError(400,'Publicera de valda bilderna, sporten och eventuella album först.');
    if(!published){ref._weak=true;ref._strengthenOnPublish={type:targetType};}
  }
}
async function save(repo,payload) {
  const type=assertType(payload.type);const doc=sanitize(type,payload.document);
  let id=payload.id ? assertId(payload.id) : null;
  if(['siteSettings','homePage'].includes(type)){if(id&&id!==type)throw new HttpError(400,'Ogiltiga sidinställningar.');id=type;}
  await references(repo,type,doc,false);
  if(!id) {
    const result=await repo.mutate([{create:{_id:'drafts.',_type:type,...doc}}]);
    return {id:canonicalId(result.results[0].document._id)};
  }
  const draft=await repo.get(`drafts.${id}`), published=await repo.get(id);
  const previous=draft||published;
  if(previous){guardType(previous);if(previous._type!==type)throw new HttpError(400,'Innehållstypen kan inte ändras.');requireRevision(previous,payload.revision);}
  const full={_id:`drafts.${id}`,_type:type,...(previous?.importKey ? {importKey:previous.importKey} : {}),...doc};
  if(draft) {
    const unset=Object.keys(stripMetadata(draft)).filter(key=>!(key in full));
    await repo.mutate([{patch:{id:draft._id,ifRevisionID:draft._rev,set:stripMetadata(full),...(unset.length?{unset}:{})}}]);
  } else await repo.mutate([{create:full}]);
  return {id};
}
async function publish(repo,id,revision) {
  assertId(id);const draft=guardType(await repo.get(`drafts.${id}`));requireRevision(draft,revision);
  const doc=sanitize(draft._type,draft,true);await references(repo,draft._type,doc,true);
  await repo.mutate([{patch:{id:draft._id,ifRevisionID:draft._rev,set:{_type:draft._type}}},{createOrReplace:{_id:id,_type:draft._type,...(draft.importKey?{importKey:draft.importKey}:{}),...doc}},{delete:{id:draft._id}}]);
  return {id};
}
async function bootstrap(repo) {
  const records=await repo.query('*[_type in $types && !(_id in path("versions.**"))] | order(_id asc)[0...5001]{...,"_assetUrl":image.asset->url}',{types});
  if(records.length>5000)throw new HttpError(413,'Biblioteket är för stort för denna portalversion. Kontakta administratören.');
  const merged=new Map();
  for(const record of records) {
    const id=canonicalId(record._id), previous=merged.get(id);
    const draft=record._id.startsWith('drafts.');
    if(!previous||draft)merged.set(id,{...record,_id:id,_isDraft:draft,_published:!draft||previous?._published===true,_publishedRevision:draft?previous?._publishedRevision:record._rev});
    else {previous._published=true;previous._publishedRevision=record._rev;}
  }
  return {documents:[...merged.values()],website:'https://simonbeverskog.github.io/TSFMedia/'};
}

export function createHandler({assets={},repositoryFactory=createRepository}={}) {
  return async function handle(request,env={}) {
    let response;
    try {
      const url=new URL(request.url),path=url.pathname;
      if(path.startsWith('/api/')) {
        if(!env.ADMIN_PASSWORD_HASH||!env.SESSION_SECRET||env.SESSION_SECRET.length<32||!env.SANITY_API_TOKEN)throw new HttpError(503,'Portalen förbereds. Försök igen om en stund.');
        if(!['GET','POST'].includes(request.method))throw new HttpError(405,'Metoden stöds inte.');
        if(request.method==='POST') {
          const origin=request.headers.get('origin');
          if(!origin||origin!==new URL(env.PORTAL_ORIGIN||request.url).origin)throw new HttpError(403,'Förfrågan behöver komma från adminportalen.');
        }
        if(path==='/api/login'&&request.method==='POST') {
          const local=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
          const ip=request.headers.get('cf-connecting-ip')||(local?request.headers.get('x-tsf-local-ip'):null)||'shared';
          if(loginLimit(ip))throw new HttpError(429,'För många försök. Vänta tio minuter och försök igen.');
          const input=await bodyJson(request);
          if(!await verifyPassword(input.password,env.ADMIN_PASSWORD_HASH)){loginLimit(ip,true);throw new HttpError(401,'Lösenordet stämmer inte. Försök igen.');}
          resetLoginLimit(ip);response=json({ok:true},200,{'Set-Cookie':await createSession(request,env)});
        } else if(path==='/api/session'&&request.method==='GET') response=json({authenticated:await authenticated(request,env)});
        else {
          if(!await authenticated(request,env))throw new HttpError(401,'Logga in för att fortsätta.');
          const repo=repositoryFactory(env);
          if(path==='/api/logout'&&request.method==='POST')response=json({ok:true},200,{'Set-Cookie':clearSession(request)});
          else if(path==='/api/content'&&request.method==='GET')response=json(await bootstrap(repo));
          else if(path==='/api/save'&&request.method==='POST')response=json(await save(repo,await bodyJson(request)));
          else if(path==='/api/publish'&&request.method==='POST'){const input=await bodyJson(request);response=json(await publish(repo,input.id,input.revision));}
          else if(path==='/api/unpublish'&&request.method==='POST') {
            const input=await bodyJson(request),id=assertId(input.id),current=guardType(await repo.get(id));
            if(['siteSettings','homePage'].includes(current._type))throw new HttpError(400,'Sidinställningar kan inte avpubliceras.');
            requireRevision(current,input.revision);
            await repo.mutate([{patch:{id,ifRevisionID:current._rev,set:{_type:current._type}}},{createIfNotExists:{...stripMetadata(current),_type:current._type,_id:`drafts.${id}`}},{delete:{id}}]);
            response=json({id});
          } else if(path==='/api/album/add-photos'&&request.method==='POST') {
            const input=await bodyJson(request),id=assertId(input.id);
            const current=guardType(await repo.get(`drafts.${id}`)||await repo.get(id));
            if(current._type!=='album'||!Array.isArray(input.photos)||input.photos.length>100)throw new HttpError(400,'Välj ett giltigt album och högst 100 bilder.');
            const photos=[...(current.photos||[])];
            for(const photo of input.photos){assertId(photo);if(!photos.some(p=>p._ref===photo))photos.push({_type:'reference',_ref:photo,_key:crypto.randomUUID()});}
            response=json(await save(repo,{id,type:'album',revision:current._rev,document:{...current,photos,cover:current.cover||photos[0]}}));
          } else if(path==='/api/upload'&&request.method==='POST') {
            const type=request.headers.get('content-type')?.split(';')[0];
            if(!['image/jpeg','image/png','image/webp'].includes(type))throw new HttpError(415,'Välj en JPEG-, PNG- eller WebP-bild.');
            const bytes=await readBody(request,20*1024*1024);
            const matches=type==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:type==='image/png'?[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v):new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP';
            if(!matches)throw new HttpError(415,'Filen verkar inte vara en giltig bild.');
            let filename='foto';try{filename=decodeURIComponent(request.headers.get('x-filename')||'foto').replace(/[\r\n\0]/g,'').slice(0,180);}catch{}
            const asset=await repo.upload(bytes,type,filename);
            response=json({asset:{_type:'reference',_ref:asset._id},url:asset.url});
          } else throw new HttpError(404,'Sidan hittades inte.');
        }
      } else {
        if(!['GET','HEAD'].includes(request.method))throw new HttpError(405,'Metoden stöds inte.');
        const asset=assets[path==='/'?'/index.html':path];
        response=asset?new Response(request.method==='HEAD'?null:asset.body,{headers:{'Content-Type':asset.type,'Cache-Control':'no-cache'}}):new Response('Sidan hittades inte.',{status:404});
      }
    } catch(error) {
      response=json({error:error instanceof HttpError?error.message:'Något gick fel. Försök igen.'},error instanceof HttpError?error.status:500);
    }
    const secured=new Response(response.body,response);
    for(const [key,value]of Object.entries(headers))secured.headers.set(key,value);
    return secured;
  };
}
