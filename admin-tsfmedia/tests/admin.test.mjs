import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHandler} from '../src/handler.js';
import {passwordHash,authenticated,createSession} from '../src/auth.js';
import {sanitize,HttpError} from '../src/content.js';
import {readFile} from 'node:fs/promises';

const password='A-test-password-only';
const env={ADMIN_PASSWORD_HASH:await passwordHash(password),SESSION_SECRET:'test-session-secret-which-is-long-enough',SANITY_API_TOKEN:'not-a-real-api-token'};
const origin='https://portal.example';
const assetId='image-abc123-1x1-png';
const photo={_id:'picture1',_type:'photo',_rev:'rev1',title:'Match',alt:'En räddning',image:{_type:'image',asset:{_type:'reference',_ref:assetId}},sport:{_type:'reference',_ref:'sport1'},date:'2026-11-25',display:'album',author:'Tobbe',demo:false};
function repository(initial=[]) {
  let docs=new Map(initial.map(d=>[d._id,structuredClone(d)])),sequence=10;
  return {
    async get(id){return structuredClone(docs.get(id)||null);},
    async query(query,params){
      const all=[...docs.values()];
      if(params.ids)return all.filter(d=>params.ids.includes(d._id)).map(d=>({_id:d._id,_type:d._type}));
      return all.filter(d=>params.types.includes(d._type)).sort((a,b)=>a._id.localeCompare(b._id));
    },
    async mutate(mutations){
      const transaction=new Map([...docs].map(([id,d])=>[id,structuredClone(d)])),results=[];
      for(const mutation of mutations){
        if(mutation.patch){const p=mutation.patch,d=transaction.get(p.id);if(!d||p.ifRevisionID&&d._rev!==p.ifRevisionID)throw new HttpError(409,'Revision conflict');Object.assign(d,p.set);for(const key of p.unset||[])delete d[key];d._rev=`rev${++sequence}`;results.push({document:d});}
        else if(mutation.delete){transaction.delete(mutation.delete.id);results.push({});}
        else {const kind=Object.keys(mutation)[0],d=structuredClone(mutation[kind]);if(d._id?.endsWith('.'))d._id+=`generated${++sequence}`;if(kind==='create'&&transaction.has(d._id))throw new HttpError(409,'Already exists');if(kind==='createIfNotExists'&&transaction.has(d._id))continue;d._rev=`rev${++sequence}`;transaction.set(d._id,d);results.push({document:d});}
      }
      docs=transaction;return {results};
    },async upload(){return {_id:assetId,url:'https://cdn.sanity.io/image.png'};},
  };
}
async function setup(initial=[]) {
  const repo=repository(initial),handle=createHandler({repositoryFactory:()=>repo,assets:{'/index.html':{body:'Login page',type:'text/html'}}});
  const cookie=(await createSession(new Request(origin),env)).split(';')[0];
  const request=(path,body,extra={})=>handle(new Request(origin+path,{method:body===undefined?'GET':'POST',headers:{Origin:origin,Cookie:cookie,...(body===undefined?{}:{'Content-Type':'application/json'}),...extra},...(body===undefined?{}:{body:JSON.stringify(body)})}),env);
  return {repo,handle,request,cookie};
}
test('all content and write endpoints require a signed session',async()=>{
  const {handle}=await setup();
  for(const path of ['/api/content','/api/save','/api/publish','/api/unpublish','/api/upload','/api/album/add-photos']){
    const response=await handle(new Request(origin+path,{method:path==='/api/content'?'GET':'POST',headers:{Origin:origin,'Content-Type':'application/json'},...(path==='/api/content'?{}:{body:'{}'})}),env);
    assert.equal(response.status,401,path);assert(!(await response.text()).includes(env.SANITY_API_TOKEN));
  }
});
test('password-only login creates an HttpOnly secure cookie; incorrect passwords fail',async()=>{
  const {handle}=await setup();
  const login=pass=>handle(new Request(origin+'/api/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','CF-Connecting-IP':'login-test'},body:JSON.stringify({password:pass})}),env);
  assert.equal((await login('wrong')).status,401);const response=await login(password);assert.equal(response.status,200);
  assert.match(response.headers.get('set-cookie'),/__Host-tsf_admin=/);assert.match(response.headers.get('set-cookie'),/HttpOnly/);assert.match(response.headers.get('set-cookie'),/SameSite=Strict/);assert.match(response.headers.get('set-cookie'),/Secure/);
  assert.equal((await response.json()).ok,true);
});
test('modified cookies and password rotation invalidate the session',async()=>{
  const cookie=(await createSession(new Request(origin),env)).split(';')[0];
  assert(await authenticated(new Request(origin,{headers:{Cookie:cookie}}),env));
  assert(!await authenticated(new Request(origin,{headers:{Cookie:cookie+'x'}}),env));
  assert(!await authenticated(new Request(origin,{headers:{Cookie:cookie}}),{...env,ADMIN_PASSWORD_HASH:await passwordHash('new-password')}));
});
test('cross-origin writes are rejected even with a valid session',async()=>{
  const {request}=await setup();assert.equal((await request('/api/save',{type:'sport',document:{title:'Match',sortOrder:1}},{Origin:'https://another.example'})).status,403);
});
test('login throttling blocks repeated attempts',async()=>{
  const {handle}=await setup();
  for(let i=0;i<10;i++)assert.equal((await handle(new Request(origin+'/api/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','CF-Connecting-IP':'rate-test'},body:JSON.stringify({password:'wrong'})}),env)).status,401);
  assert.equal((await handle(new Request(origin+'/api/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','CF-Connecting-IP':'rate-test'},body:JSON.stringify({password})}),env)).status,429);
});
test('new content receives a server-generated draft ID and cannot overwrite arbitrary types',async()=>{
  const {request,repo}=await setup();
  const response=await request('/api/save',{type:'sport',document:{_id:'target',_type:'sanity.imageAsset',title:'Fotboll',sortOrder:10,secret:'overposted'}});
  assert.equal(response.status,200);const {id}=await response.json();assert.match(id,/^generated/);
  const draft=await repo.get('drafts.'+id);assert.equal(draft._type,'sport');assert(!draft.secret);assert.equal(await repo.get(id),null);
  assert.equal((await request('/api/save',{type:'sanity.imageAsset',document:{}})).status,400);
});
test('publishing validates content and preserves the draft on validation failure',async()=>{
  const draft={_id:'drafts.sport1',_type:'sport',_rev:'rev1',title:'',sortOrder:0};const {request,repo}=await setup([draft]);
  assert.equal((await request('/api/publish',{id:'sport1',revision:'rev1'})).status,400);assert(await repo.get(draft._id));assert.equal(await repo.get('sport1'),null);
});
test('publishing copies a valid draft to the public document atomically',async()=>{
  const {request,repo}=await setup([{_id:'drafts.sport1',_type:'sport',_rev:'rev1',title:'Fotboll',sortOrder:0}]);
  assert.equal((await request('/api/publish',{id:'sport1',revision:'rev1'})).status,200);assert.equal((await repo.get('sport1')).title,'Fotboll');assert.equal(await repo.get('drafts.sport1'),null);
});
test('concurrent saves reject stale revisions instead of overwriting changes',async()=>{
  const {request,repo}=await setup([{_id:'drafts.sport1',_type:'sport',_rev:'current',title:'Handboll',sortOrder:10}]);
  assert.equal((await request('/api/save',{id:'sport1',type:'sport',revision:'old',document:{title:'Fotboll',sortOrder:10}})).status,409);assert.equal((await repo.get('drafts.sport1')).title,'Handboll');
});
test('an album cannot publish until its referenced photos are published',async()=>{
  const album={_id:'drafts.album1',_type:'album',_rev:'rev1',title:'Match',date:'2026-11-25',sport:{_ref:'sport1'},photos:[{_ref:'picture1'}]};
  const {request,repo}=await setup([{_id:'sport1',_type:'sport',_rev:'r'}, {...photo,_id:'drafts.picture1'},album]);
  assert.equal((await request('/api/publish',{id:'album1',revision:'rev1'})).status,400);assert(await repo.get('drafts.album1'));
});
test('unpublish keeps a draft and the bootstrap returns separate public and draft revisions',async()=>{
  const current={_id:'sport1',_type:'sport',_rev:'public-rev',title:'Fotboll',sortOrder:1},draft={...current,_id:'drafts.sport1',_rev:'draft-rev',title:'Handboll'};
  const {request,repo}=await setup([current,draft]);const boot=await(await request('/api/content')).json();assert.equal(boot.documents[0]._rev,'draft-rev');assert.equal(boot.documents[0]._publishedRevision,'public-rev');
  assert.equal((await request('/api/unpublish',{id:'sport1',revision:'public-rev'})).status,200);assert.equal(await repo.get('sport1'),null);assert.equal((await repo.get('drafts.sport1')).title,'Handboll');
});
test('album size, duplicate photos and unsafe links are validated server-side',()=>{
  assert.throws(()=>sanitize('album',{photos:Array.from({length:101},(_,i)=>({_ref:`picture${i}`}))}),/1–100/);
  assert.throws(()=>sanitize('album',{photos:[{_ref:'picture1'},{_ref:'picture1'}]}),/en gång/);
  assert.throws(()=>sanitize('photo',{source:'javascript:alert(1)'}),/länk|https/);
});
test('image endpoints reject non-image payloads before uploading',async()=>{
  const {handle,cookie}=await setup();const response=await handle(new Request(origin+'/api/upload',{method:'POST',headers:{Origin:origin,Cookie:cookie,'Content-Type':'image/jpeg'},body:'not a JPEG'}),env);assert.equal(response.status,415);
});
test('the built Worker serves assets and contains no local secret values',async()=>{
  const source=await readFile(new URL('../dist/server/index.js',import.meta.url),'utf8');
  for(const key of ['ADMIN_PASSWORD_HASH','SESSION_SECRET','SANITY_API_TOKEN'])if(process.env[key])assert(!source.includes(process.env[key]),`${key} leaked into build`);
  const worker=(await import('../dist/server/index.js')).default;const page=await worker.fetch(new Request(origin),env);assert.equal(page.status,200);assert.match(await page.text(),/Lösenord/);
  assert.equal((await worker.fetch(new Request(origin+'/.env.local'),env)).status,404);
});
