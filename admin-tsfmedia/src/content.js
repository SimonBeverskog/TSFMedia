import {fields, getValue, setValue} from '../public/schema.js';
export const types = Object.keys(fields);
export class HttpError extends Error {constructor(status, message) {super(message); this.status = status;}}
const fail = message => {throw new HttpError(400, message);};
const validId = id => typeof id === 'string' && /^[a-zA-Z0-9_-][a-zA-Z0-9_.-]{0,127}$/.test(id) && !id.startsWith('versions.') && !id.startsWith('drafts.');
export const canonicalId = id => String(id || '').replace(/^drafts\./,'');
export function assertId(id) {if (!validId(id)) fail('Ogiltigt innehålls-id.'); return id;}
export function assertType(type) {if (!types.includes(type)) fail('Okänd innehållstyp.'); return type;}
function reference(value) {
  if (!value) return undefined;
  if (typeof value !== 'object' || !validId(value._ref)) fail('Välj ett giltigt innehåll.');
  return {_type:'reference',_ref:value._ref};
}
export function sanitize(type, input, strict = false) {
  assertType(type);
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('Innehållet saknas.');
  const output = {};
  for (const field of fields[type]) {
    const value = getValue(input,field.path);
    if (field.kind === 'boolean') {setValue(output,field.path,value === true); continue;}
    if (field.kind === 'number') {
      if (value === undefined || value === '') {if (strict && field.required) fail(`${field.label} behöver fyllas i.`); continue;}
      if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value > 1000000) fail(`${field.label} behöver vara ett positivt heltal.`);
      setValue(output,field.path,value); continue;
    }
    if (['sport','photo','album'].includes(field.kind)) {
      const ref = reference(value);
      if (strict && field.required && !ref) fail(`Välj ${field.label.toLowerCase()}.`);
      if (ref) setValue(output,field.path,ref);
      continue;
    }
    if (value == null) {if (strict && field.required) fail(`${field.label} behöver fyllas i.`); continue;}
    if (typeof value !== 'string') fail(`${field.label} behöver vara text.`);
    const clean = value.trim();
    if (strict && field.required && !clean) fail(`${field.label} behöver fyllas i.`);
    if (clean.length > (field.max || 10000)) fail(`${field.label} är för lång.`);
    if (clean && field.kind === 'date' && (!/^\d{4}-\d{2}-\d{2}$/.test(clean) || Number.isNaN(Date.parse(clean)))) fail('Kontrollera datumet.');
    if (clean && field.kind === 'datetime-local' && Number.isNaN(Date.parse(clean))) fail('Kontrollera publiceringsdatumet.');
    if (clean && field.kind === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) fail('Kontrollera e-postadressen.');
    if (clean && field.kind === 'url') {try {if (new URL(clean).protocol !== 'https:') fail('Länkar behöver börja med https://.');} catch {fail('Kontrollera länken.');}}
    if (clean && field.kind === 'select' && !field.options.some(([v])=>v===clean)) fail('Välj ett giltigt visningsalternativ.');
    setValue(output,field.path,clean);
  }
  if (type === 'photo') {
    const asset = input.image?.asset?._ref;
    if (asset && !/^image-[a-zA-Z0-9]+-\d+x\d+-[a-zA-Z0-9]+$/.test(asset)) fail('Bildfilen är ogiltig.');
    if (strict && !asset) fail('Ladda upp en bild först.');
    if (asset) {
      output.image = {_type:'image',asset:{_type:'reference',_ref:asset}};
      for (const key of ['crop','hotspot']) if (input.image[key]) {
        const keys = key === 'crop' ? ['top','bottom','left','right'] : ['x','y','height','width'];
        output.image[key] = {_type:key === 'crop' ? 'sanity.imageCrop' : 'sanity.imageHotspot'};
        for (const part of keys) {const n=input.image[key][part]; if (typeof n !== 'number' || n<0 || n>1) fail('Ogiltig bildbeskärning.'); output.image[key][part]=n;}
      }
    }
  }
  if (type === 'album') {
    if (input.photos != null && !Array.isArray(input.photos)) fail('Kontrollera albumets bilder.');
    const photos = input.photos || [];
    if (photos.length > 100 || (strict && !photos.length)) fail('Ett publicerat album behöver 1–100 bilder.');
    const seen = new Set();
    output.photos = photos.map(photo => {
      const ref=reference(photo); if (!ref || seen.has(ref._ref)) fail('En bild kan bara finnas en gång i samma album.'); seen.add(ref._ref);
      return {...ref,_key:typeof photo._key==='string' && /^[\w-]{1,80}$/.test(photo._key) ? photo._key : crypto.randomUUID()};
    });
  }
  if (type === 'news') {
    if (!Array.isArray(input.body) || input.body.length > 500) fail('Kontrollera nyhetstexten.');
    output.body = input.body.map((block,index) => {
      if (block._type !== 'block' || !Array.isArray(block.children) || block.children.length > 1000) fail('Kontrollera nyhetstexten.');
      return {_type:'block',_key:typeof block._key==='string' ? block._key.slice(0,80) : `block-${index}`,style:['normal','h3','blockquote'].includes(block.style) ? block.style : 'normal',
        ...(block.listItem && ['bullet','number'].includes(block.listItem) ? {listItem:block.listItem,level:Math.min(10,Math.max(1,Number(block.level)||1))} : {}), markDefs:[],
        children:block.children.map((span,i)=>{if (typeof span.text!=='string'||span.text.length>20000) fail('Textstycket är för långt.');return {_type:'span',_key:`span-${i}`,text:span.text,marks:(Array.isArray(span.marks)?span.marks:[]).filter(m=>['strong','em'].includes(m))};})};
    });
    if (strict && !output.body.some(b=>b.children.some(s=>s.text.trim()))) fail('Skriv en nyhetstext.');
  }
  if (type === 'siteSettings') {
    if (!Array.isArray(input.navigation) || input.navigation.length > 6 || (strict && !input.navigation.length)) fail('Menyn behöver 1–6 länkar.');
    output.navigation=input.navigation.map((link,i)=>{
      if (typeof link.label!=='string'||link.label.length>80||!['evenemang','om','nyheter','kontakt'].includes(link.target)||strict&&!link.label.trim()) fail('Kontrollera menylänkarna.');
      return {_type:'navigationLink',_key:typeof link._key==='string' ? link._key.slice(0,80) : `link-${i}`,label:link.label.trim(),target:link.target};
    });
  }
  return output;
}

export function createRepository(env, transport = fetch) {
  const project = env.SANITY_PROJECT_ID || 'd11tiunw';
  const dataset = env.SANITY_DATASET || 'production';
  if (!/^[a-z0-9]+$/.test(project) || !/^[a-z0-9_-]+$/.test(dataset)) throw new HttpError(503,'Portalen är inte färdigkonfigurerad.');
  const base=`https://${project}.api.sanity.io/v2026-11-25`;
  async function request(path,options={}) {
    const response=await transport(base+path,{...options,headers:{Authorization:`Bearer ${env.SANITY_API_TOKEN}`,...options.headers},signal:AbortSignal.timeout(45000)});
    if (!response.ok) {
      if ([409,412].includes(response.status)) throw new HttpError(409,'Innehållet har ändrats eller används av annat innehåll. Ladda om och kontrollera referenserna.');
      throw new HttpError(response.status===400 ? 400 : 502,'Ändringen kunde inte genomföras. Kontrollera innehållet och försök igen.');
    }
    return response.json();
  }
  async function query(q,params={}) {
    const search=new URLSearchParams({query:q,perspective:'raw'});
    for (const [key,value] of Object.entries(params)) search.set(`$${key}`,JSON.stringify(value));
    return (await request(`/data/query/${dataset}?${search}`)).result;
  }
  async function mutate(mutations) {return request(`/data/mutate/${dataset}?returnDocuments=true&visibility=sync`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mutations})});}
  async function get(id) {return query('*[_id == $id][0]',{id});}
  return {query,mutate,get,async upload(bytes,type,filename) {
    const response=await request(`/assets/images/${dataset}?${new URLSearchParams({filename})}`,{method:'POST',headers:{'Content-Type':type},body:bytes});
    return response.document;
  }};
}
