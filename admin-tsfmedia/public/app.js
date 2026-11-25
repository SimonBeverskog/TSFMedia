import {sections,fields,labels,getValue,setValue} from './schema.js';
const $=(s,root=document)=>root.querySelector(s), $$=(s,root=document)=>[...root.querySelectorAll(s)];
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>new Date().toLocaleDateString('sv-SE');
const state={documents:[],section:'dashboard',query:'',status:'all',page:0,selected:new Set(),editor:null,queue:[],busy:false};
const ofType=type=>state.documents.filter(d=>d._type===type);
const find=id=>state.documents.find(d=>d._id===id);
const title=doc=>doc?.title||(doc?._type==='homePage'?'Sidans texter':doc?._type==='siteSettings'?'Kontakt & meny':'Utan rubrik');
function imageUrl(doc,width=600){return doc?._assetUrl?.startsWith('https://cdn.sanity.io/')?`${doc._assetUrl}?w=${width}&auto=format&fit=max&q=80`:'';}
function toast(message,error=false){$('#toast').textContent=message;$('#toast').classList.toggle('error',error);$('#toast').hidden=false;clearTimeout(state.toastTimer);state.toastTimer=setTimeout(()=>{$('#toast').hidden=true;},7000);}
async function api(path,body,options={}) {
  let response;
  try {response=await fetch(path,{...options,method:body===undefined?'GET':'POST',credentials:'same-origin',headers:body===undefined?{}:{'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});}
  catch {throw new Error('Kunde inte ansluta. Kontrollera anslutningen och försök igen.');}
  const data=await response.json().catch(()=>({error:'Svaret kunde inte läsas.'}));
  if(!response.ok){if(response.status===401&&path!=='/api/login')showLogin();throw new Error(data.error||'Något gick fel.');}return data;
}
function showLogin(){$('#app-view').hidden=true;$('#login-view').hidden=false;state.documents=[];state.selected.clear();for(const dialog of $$('dialog'))dialog.close();}
async function loadContent(){const data=await api('/api/content');state.documents=data.documents;$('#website-link').href=data.website;render();}
async function enter(){await loadContent();$('#login-view').hidden=true;$('#app-view').hidden=false;}
$('#toggle-password').addEventListener('click',()=>{const input=$('#password'),visible=input.type==='password';input.type=visible?'text':'password';$('#toggle-password').textContent=visible?'Dölj':'Visa';$('#toggle-password').setAttribute('aria-label',visible?'Dölj lösenord':'Visa lösenord');});
$('#login-form').addEventListener('submit',async event=>{
  event.preventDefault();$('#login-button').disabled=true;$('#login-button').textContent='Loggar in…';$('#login-error').textContent='';
  try{await api('/api/login',{password:$('#password').value});$('#password').value='';await enter();}
  catch(error){$('#login-error').textContent=error.message;}
  finally{$('#login-button').disabled=false;$('#login-button').textContent='Logga in';}
});
$('#logout').addEventListener('click',async()=>{try{await api('/api/logout',{});showLogin();$('#password').focus();}catch(error){toast(error.message,true);}});
$('#sections').innerHTML=sections.map(s=>`<a href="#${s.id}">${esc(s.label)}</a>`).join('');
function route(){const section=location.hash.slice(1);state.section=sections.some(s=>s.id===section)?section:'dashboard';state.query='';state.status='all';state.page=0;state.selected.clear();render();}
window.addEventListener('hashchange',route);
function badge(doc){return `<span class="badge ${doc._isDraft?'draft':''}">${doc._isDraft?(doc._published?'Ändrat utkast':'Utkast'):'Publicerad'}</span>`;}
function card(doc){const photo=doc._type==='photo'?doc:find(doc.cover?._ref||doc.photo?._ref||doc.photos?.[0]?._ref),src=imageUrl(photo),sport=find(doc.sport?._ref)?.title;return `<article class="content-card">${doc._type==='photo'?`<label class="card-check"><input type="checkbox" data-select="${esc(doc._id)}" aria-label="Välj ${esc(title(doc))}" ${state.selected.has(doc._id)?'checked':''}></label>`:''}<button class="card-button" type="button" data-edit="${esc(doc._id)}"><div class="card-image">${src?`<img src="${esc(src)}" alt="${esc(photo.alt||'')}" loading="lazy" width="600" height="390">`:`<span class="image-placeholder">${doc._type==='news'?'NYHET':doc._type==='sport'?'SPORT':'ALBUM'}</span>`}</div><div class="card-content"><div class="card-kicker"><span>${esc(sport||doc.category||doc._type==='sport'&&'Sport'||'Bildarkivet')}</span>${badge(doc)}</div><h3>${esc(title(doc))}</h3><p>${doc._type==='album'?`${doc.photos?.length||0} bilder · `:''}${esc(doc.date||doc.publishedAt?.slice(0,10)||doc.subtitle||doc.alt||'')}</p></div></button></article>`;}
function render(){
  $$('#sections a').forEach(a=>a.setAttribute('aria-current',a.hash===`#${state.section}`?'page':'false'));
  const main=$('#workspace-main');
  if(['homePage','siteSettings'].includes(state.section)){
    main.innerHTML=`<div class="page-heading"><div><p class="eyebrow">HEMSIDAN</p><h1>${state.section==='homePage'?'Sidans texter.':'Kontakt & meny.'}</h1></div><button class="button primary" data-singleton="${state.section}">Redigera ${state.section==='homePage'?'sidans texter':'kontakt & meny'}</button></div><p class="dashboard-note">Ändra innehållet och spara som utkast. Klicka på Publicera när det är redo att visas på hemsidan.</p>`;
    return;
  }
  if(state.section==='dashboard'){
    const albums=ofType('album').sort((a,b)=>(b.date||'').localeCompare(a.date||''));
    const drafts=state.documents.filter(d=>d._isDraft).length;
    main.innerHTML=`<div class="page-heading"><div><p class="eyebrow">TOBBES SPORTFOTON</p><h1>Ditt nästa ögonblick.</h1></div><div class="heading-actions"><button class="button secondary" data-new="album">Nytt album</button><button class="button primary" data-upload>Ladda upp bilder</button></div></div><p class="muted">Samla bilderna. Berätta om matchen. Håll hemsidan levande.</p><div class="stats"><div class="stat"><strong>${albums.length}</strong><span>Album & evenemang</span></div><div class="stat"><strong>${ofType('photo').length}</strong><span>Bilder i biblioteket</span></div><div class="stat"><strong>${drafts}</strong><span>Utkast att se över</span></div></div><div class="section-bar"><h2>Senaste albumen.</h2><a class="plain" href="#album">Visa alla album</a></div>${albums.length?`<div class="content-grid">${albums.slice(0,6).map(card).join('')}</div>`:'<div class="empty"><h2>Börja med ett album.</h2><p>Skapa ett evenemang och ladda sedan upp bilderna.</p><button class="button primary" data-new="album">Skapa första albumet</button></div>'}<div class="section-bar"><h2>Från utkast till hemsida.</h2></div><p class="dashboard-note">Nya bilder och ändringar sparas som utkast. Publicera bilderna först och sedan albumet. Förändringarna visas på hemsidan efter omladdning.</p>`;
    return;
  }
  const section=sections.find(s=>s.id===state.section);
  main.innerHTML=`<div class="page-heading"><div><p class="eyebrow">DITT INNEHÅLL</p><h1>${esc(section.label)}.</h1></div><div class="heading-actions">${state.section==='photo'?'<button class="button primary" data-upload>Ladda upp bilder</button>':`<button class="button primary" data-new="${state.section}">Ny${state.section==='album'?'tt album':state.section==='news'?' nyhet':' sport'}</button>`}</div></div><div class="archive-controls"><input id="content-search" type="search" placeholder="Sök ${esc(section.label.toLowerCase())}…" aria-label="Sök innehåll" value="${esc(state.query)}"><select id="content-status" aria-label="Filtrera efter status"><option value="all">Alla statusar</option><option value="draft">Utkast</option><option value="published">Publicerade</option></select>${state.section==='photo'?'<button class="button secondary" id="select-page">Välj denna sida</button>':''}</div><div id="selection-area"></div><div id="collection"></div>`;
  $('#content-status').value=state.status;renderCollection();
}
function visibleDocuments(){const query=state.query.toLocaleLowerCase('sv-SE');return ofType(state.section).filter(d=>(state.status==='all'||(state.status==='draft'?d._isDraft:d._published))&&`${title(d)} ${d.alt||''} ${find(d.sport?._ref)?.title||''}`.toLocaleLowerCase('sv-SE').includes(query)).sort((a,b)=>state.section==='sport'?(a.sortOrder||0)-(b.sortOrder||0):(b.date||b.publishedAt||b._updatedAt||'').localeCompare(a.date||a.publishedAt||a._updatedAt||''));}
function renderCollection(){
  const all=visibleDocuments(),pageSize=36,pages=Math.max(1,Math.ceil(all.length/pageSize));state.page=Math.min(state.page,pages-1);
  $('#selection-area').innerHTML=state.selected.size?`<div class="selection-bar"><span>${state.selected.size} bilder valda</span><button type="button" class="button primary" id="publish-selected">Publicera valda</button><button type="button" class="plain" id="clear-selection">Avmarkera</button></div>`:'';
  $('#collection').innerHTML=all.length?`<div class="content-grid">${all.slice(state.page*pageSize,(state.page+1)*pageSize).map(card).join('')}</div>${pages>1?`<div class="pagination"><button class="button secondary" data-page="${state.page-1}" ${state.page===0?'disabled':''}>Föregående</button><span>${state.page+1} / ${pages}</span><button class="button secondary" data-page="${state.page+1}" ${state.page===pages-1?'disabled':''}>Nästa</button></div>`:''}`:'<div class="empty"><h2>Här är det tomt ännu.</h2><p>Skapa innehåll eller prova en annan sökning.</p></div>';
}
$('#workspace-main').addEventListener('input',event=>{if(event.target.id==='content-search'){state.query=event.target.value;state.page=0;renderCollection();}});
$('#workspace-main').addEventListener('change',event=>{
  if(event.target.id==='content-status'){state.status=event.target.value;state.page=0;renderCollection();}
  if(event.target.matches('[data-select]')){if(event.target.checked&&state.selected.size>=100){event.target.checked=false;toast('Välj högst 100 bilder åt gången.',true);return;}event.target.checked?state.selected.add(event.target.dataset.select):state.selected.delete(event.target.dataset.select);renderCollection();}
});
$('#workspace-main').addEventListener('click',async event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.hasAttribute('data-new'))openEditor(button.dataset.new);
  if(button.hasAttribute('data-edit'))openEditor(find(button.dataset.edit)._type,button.dataset.edit);
  if(button.hasAttribute('data-singleton'))openEditor(button.dataset.singleton,button.dataset.singleton);
  if(button.hasAttribute('data-upload'))openUpload();
  if(button.hasAttribute('data-page')){state.page=Number(button.dataset.page);renderCollection();}
  if(button.id==='clear-selection'){state.selected.clear();renderCollection();}
  if(button.id==='select-page'){for(const doc of visibleDocuments().slice(state.page*36,(state.page+1)*36)){if(state.selected.size<100)state.selected.add(doc._id);}renderCollection();}
  if(button.id==='publish-selected'){
    button.disabled=true;let count=0;
    try{for(const id of state.selected){const doc=find(id);if(doc?._isDraft){await api('/api/publish',{id,revision:doc._rev});count++;button.textContent=`Publicerar… ${count}`;}}state.selected.clear();await loadContent();toast(`${count} bilder publicerade.`);}
    catch(error){await loadContent().catch(()=>{});toast(error.message,true);}finally{button.disabled=false;}
  }
});
function defaults(type){return {_type:type,...(type==='photo'?{date:today(),display:'album',author:find('siteSettings')?.name||'Tobbe Bengtson'}:{}),...(type==='album'?{date:today(),photos:[]}:{}),...(type==='news'?{category:'AKTUELLT',publishedAt:new Date().toISOString(),body:[]}:{}),...(type==='sport'?{sortOrder:ofType('sport').length*10}:{}),...(type==='siteSettings'?{navigation:[]}:{}),demo:false};}
function options(kind){return ofType(kind).map(d=>`<option value="${esc(d._id)}">${esc(title(d))}${d._isDraft?' (utkast)':''}</option>`).join('');}
function fieldHtml(field,data){
  let value=getValue(data,field.path),control;const attrs=`name="${field.path}" id="field-${field.path.replaceAll('.','-')}"`;
  if(field.kind==='boolean')return `<label class="checkbox-label"><input ${attrs} type="checkbox" ${value?'checked':''}>${esc(field.label)}</label>`;
  if(['sport','photo','album'].includes(field.kind))control=`<select ${attrs}><option value="">${field.required?'Välj…':'Ingen vald'}</option>${options(field.kind)}</select>`;
  else if(field.kind==='select')control=`<select ${attrs}>${field.options.map(([v,l])=>`<option value="${v}">${esc(l)}</option>`).join('')}</select>`;
  else if(field.kind==='textarea')control=`<textarea ${attrs} rows="3" ${field.max?`maxlength="${field.max}"`:''}>${esc(value)}</textarea>`;
  else {if(field.kind==='datetime-local'&&value){const date=new Date(value);value=new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16);}control=`<input ${attrs} type="${field.kind}" value="${esc(value)}" ${field.max?`maxlength="${field.max}"`:''} ${field.kind==='number'?'min="0" step="1"':''}>`;}
  return `<label class="${field.kind==='textarea'?'wide':''}">${esc(field.label)}${field.required?' *':''}${control}</label>`;
}
function bodyText(body){return (body||[]).map(block=>(block.children||[]).map(span=>span.text).join('')).join('\n\n');}
function openEditor(type,id){
  const record=id?find(id):null,data=structuredClone(record||defaults(type));state.editor={type,record,data,photos:(data.photos||[]).map(p=>p._ref),navigation:structuredClone(data.navigation||[])};
  $('#editor-title').textContent=record?title(record):`Ny${type==='album'?'tt album':type==='photo'?' bild':type==='news'?' nyhet':' sport'}`;
  $('#editor-status').textContent=record?(record._isDraft?'UTKAST':'PUBLICERAD'):'NYTT INNEHÅLL';$('#editor-error').textContent='';
  const grouped=new Map();for(const field of fields[type]){const group=field.group||'Innehåll';if(!grouped.has(group))grouped.set(group,[]);grouped.get(group).push(field);}
  $('#editor-fields').innerHTML=`${type==='photo'&&imageUrl(data)?`<img class="editor-image" src="${esc(imageUrl(data,1000))}" alt="${esc(data.alt)}">`:''}<p class="form-help">Fält med * behövs för publicering. Du kan spara ofärdigt innehåll som utkast.</p>${[...grouped].map(([group,list],i)=>grouped.size>1?`<details class="field-group" ${i===0?'open':''}><summary>${esc(group)}</summary><div class="form-grid">${list.map(f=>fieldHtml(f,data)).join('')}</div></details>`:`<div class="form-grid">${list.map(f=>fieldHtml(f,data)).join('')}</div>`).join('')}${type==='news'?`<div class="form-grid"><label class="wide">Nyhetstext *<textarea id="news-body" rows="12">${esc(bodyText(data.body))}</textarea><span class="small muted">Separera stycken med en tom rad.</span></label></div>`:''}${type==='album'?'<div class="section-bar"><h3>Bilder i albumet.</h3><span class="small muted" id="album-count"></span></div><p class="small muted">Ändra ordningen med knapparna. Publicera bilderna före albumet.</p><ol class="photo-order" id="photo-order"></ol><details class="field-group"><summary>Välj bilder från biblioteket</summary><div class="picker-grid" id="photo-picker"></div></details>':''}${type==='siteSettings'?'<div class="section-bar"><h3>Menylänkar.</h3></div><div id="nav-editor"></div><button class="button secondary" type="button" id="add-nav">Lägg till länk</button>':''}`;
  for(const field of fields[type])if(['sport','photo','album','select'].includes(field.kind))$('#editor-form').elements.namedItem(field.path).value=['sport','photo','album'].includes(field.kind)?getValue(data,field.path)?._ref||'':getValue(data,field.path)||field.options?.[0][0]||'';
  $('#unpublish-button').hidden=!record?._published||['siteSettings','homePage'].includes(type);
  if(type==='album')renderPhotoOrder();if(type==='siteSettings')renderNavigation();$('#editor-dialog').showModal();
}
function renderPhotoOrder(){
  const list=state.editor.photos;$('#album-count').textContent=`${list.length} / 100 bilder`;
  $('#photo-order').innerHTML=list.map((id,i)=>{const photo=find(id);return `<li>${imageUrl(photo)?`<img src="${esc(imageUrl(photo,160))}" alt="" width="70" height="48">`:''}<span>${esc(title(photo)||'Saknad bild')}</span><button class="mini-button" type="button" data-move="${i}" data-direction="-1" aria-label="Flytta ${esc(title(photo))} upp" ${i===0?'disabled':''}>Upp</button><button class="mini-button" type="button" data-move="${i}" data-direction="1" aria-label="Flytta ${esc(title(photo))} ned" ${i===list.length-1?'disabled':''}>Ned</button><button class="mini-button" type="button" data-remove-photo="${i}" aria-label="Ta bort ${esc(title(photo))} ur albumet">Ta bort</button></li>`;}).join('');
  $('#photo-picker').innerHTML=ofType('photo').map(photo=>`<button class="picker-item" type="button" data-pick-photo="${esc(photo._id)}" aria-pressed="${list.includes(photo._id)}" aria-label="Välj ${esc(title(photo))}">${imageUrl(photo)?`<img src="${esc(imageUrl(photo,160))}" alt="" width="160" height="160" loading="lazy">`:esc(title(photo))}</button>`).join('');
}
function renderNavigation(){$('#nav-editor').innerHTML=state.editor.navigation.map((link,i)=>`<div class="nav-row"><input data-nav-label="${i}" aria-label="Länktext ${i+1}" value="${esc(link.label)}"><select data-nav-target="${i}" aria-label="Avsnitt ${i+1}">${[['evenemang','Evenemang'],['om','Om fotografen'],['nyheter','Nyheter'],['kontakt','Kontakt']].map(([value,label])=>`<option value="${value}" ${link.target===value?'selected':''}>${label}</option>`).join('')}</select><button type="button" class="mini-button" data-remove-nav="${i}" aria-label="Ta bort menylänk ${i+1}">Ta bort</button></div>`).join('');}
function collectNavigation(){state.editor.navigation=state.editor.navigation.map((link,i)=>({...link,label:$(`[data-nav-label="${i}"]`).value,target:$(`[data-nav-target="${i}"]`).value}));}
function collectEditor(){
  const {type,data}=state.editor,document=structuredClone(data),form=$('#editor-form');
  for(const field of fields[type]){const input=form.elements.namedItem(field.path);let value=input.value;if(field.kind==='boolean')value=input.checked;else if(field.kind==='number')value=value===''?'':Number(value);else if(['sport','photo','album'].includes(field.kind))value=value?{_type:'reference',_ref:value}:undefined;else if(field.kind==='datetime-local'&&value)value=new Date(value).toISOString();setValue(document,field.path,value);}
  if(type==='album')document.photos=state.editor.photos.map(id=>data.photos?.find(p=>p._ref===id)||{_type:'reference',_ref:id,_key:crypto.randomUUID()});
  if(type==='news'&&$('#news-body').value!==bodyText(data.body))document.body=$('#news-body').value.split(/\n\s*\n/).map((text,i)=>({_key:`paragraph-${i}`,_type:'block',style:'normal',markDefs:[],children:[{_key:'text',_type:'span',text,marks:[]}]}));
  if(type==='siteSettings'){collectNavigation();document.navigation=state.editor.navigation;}
  return document;
}
async function saveEditor(publish=false){
  const {type,record}=state.editor;$('#editor-error').textContent='';$$('.dialog-actions button',$('#editor-dialog')).forEach(b=>b.disabled=true);
  try{
    const result=await api('/api/save',{type,id:record?._id,revision:record?._rev,document:collectEditor()});await loadContent();state.editor.record=find(result.id);state.editor.data=structuredClone(state.editor.record);
    if(publish){await api('/api/publish',{id:result.id,revision:state.editor.record._rev});await loadContent();$('#editor-dialog').close();toast('Publicerat. Ändringen visas på hemsidan efter omladdning.');}
    else{$('#editor-status').textContent='UTKAST SPARAT';toast('Utkastet är sparat.');}
  }catch(error){$('#editor-error').textContent=error.message;}
  finally{$$('.dialog-actions button',$('#editor-dialog')).forEach(b=>b.disabled=false);}
}
$('#editor-form').addEventListener('submit',event=>{event.preventDefault();saveEditor();});$('#publish-button').addEventListener('click',()=>saveEditor(true));
$('#unpublish-button').addEventListener('click',async()=>{
  if(!confirm('Avpublicera innehållet från hemsidan? Det finns kvar som utkast.'))return;
  try{const record=state.editor.record;await api('/api/unpublish',{id:record._id,revision:record._publishedRevision});await loadContent();$('#editor-dialog').close();toast('Avpublicerat. Innehållet finns kvar som utkast.');}catch(error){$('#editor-error').textContent=error.message;}
});
$('#editor-fields').addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.hasAttribute('data-move')){const i=Number(button.dataset.move),j=i+Number(button.dataset.direction);[state.editor.photos[i],state.editor.photos[j]]=[state.editor.photos[j],state.editor.photos[i]];renderPhotoOrder();}
  if(button.hasAttribute('data-remove-photo')){state.editor.photos.splice(Number(button.dataset.removePhoto),1);renderPhotoOrder();}
  if(button.hasAttribute('data-pick-photo')){const id=button.dataset.pickPhoto,index=state.editor.photos.indexOf(id);if(index>=0)state.editor.photos.splice(index,1);else if(state.editor.photos.length<100)state.editor.photos.push(id);else toast('Albumet får innehålla högst 100 bilder.',true);renderPhotoOrder();}
  if(button.id==='add-nav'){collectNavigation();if(state.editor.navigation.length>=6){toast('Menyn får ha högst sex länkar.',true);return;}state.editor.navigation.push({_type:'navigationLink',_key:crypto.randomUUID(),label:'',target:'kontakt'});renderNavigation();}
  if(button.hasAttribute('data-remove-nav')){collectNavigation();state.editor.navigation.splice(Number(button.dataset.removeNav),1);renderNavigation();}
});
for(const dialog of $$('dialog')){dialog.addEventListener('click',event=>{if(event.target.closest('[data-close]')&&!state.busy)dialog.close();});dialog.addEventListener('cancel',event=>{if(state.busy)event.preventDefault();});}
function openUpload(){
  state.queue=[];$('#upload-form').reset();$('#upload-date').value=today();$('#upload-error').textContent='';$('#upload-progress').innerHTML='';
  $('#upload-sport').innerHTML='<option value="">Välj sport</option>'+ofType('sport').filter(d=>d._published).map(d=>`<option value="${d._id}">${esc(d.title)}</option>`).join('');$('#upload-album').innerHTML='<option value="">Bara bildbiblioteket</option>'+options('album');$('#upload-dialog').showModal();
}
$('#upload-album').addEventListener('change',()=>{const album=find($('#upload-album').value);if(album?.sport?._ref)$('#upload-sport').value=album.sport._ref;if(album?.date)$('#upload-date').value=album.date;});
$('#upload-files').addEventListener('change',event=>{const files=[...event.target.files];state.queue=[];if(files.length>100||files.some(file=>file.size>20*1024*1024||!['image/jpeg','image/png','image/webp'].includes(file.type))){$('#upload-error').textContent='Välj 1–100 JPEG-, PNG- eller WebP-bilder, högst 20 MB per fil.';event.target.value='';return;}$('#upload-error').textContent='';state.queue=files.map(file=>({file,status:'Väntar'}));renderQueue();});
function renderQueue(){$('#upload-progress').innerHTML=`<p class="small muted">${state.queue.filter(item=>item.id).length} av ${state.queue.length} bilder sparade</p>`+state.queue.map(item=>`<div class="upload-row">${esc(item.file.name)} — <strong>${esc(item.status)}</strong></div>`).join('');}
$('#upload-form').addEventListener('submit',async event=>{
  event.preventDefault();if(!state.queue.length)return;const sport=$('#upload-sport').value,date=$('#upload-date').value,album=$('#upload-album').value,display=$('#upload-display').value;
  state.busy=true;$$('input,select,button',$('#upload-form')).forEach(input=>input.disabled=true);$('#upload-error').textContent='';
  try{
    for(const item of state.queue){if(item.id)continue;try{
      item.status='Laddar upp…';renderQueue();
      if(!item.asset){const response=await fetch('/api/upload',{method:'POST',credentials:'same-origin',headers:{'Content-Type':item.file.type,'X-Filename':encodeURIComponent(item.file.name)},body:item.file});const data=await response.json();if(!response.ok)throw new Error(data.error||'Uppladdningen misslyckades.');item.asset=data.asset;}
      const name=item.file.name.replace(/\.[^.]+$/,'');const saved=await api('/api/save',{type:'photo',document:{title:name,alt:name,image:{_type:'image',asset:item.asset},sport:{_type:'reference',_ref:sport},date,display,author:find('siteSettings')?.name||'Tobbe Bengtson',demo:false}});
      item.id=saved.id;item.status='Utkast sparat';
    }catch(error){item.status=error.message;}renderQueue();}
    const saved=state.queue.filter(item=>item.id);
    if(album&&saved.length)await api('/api/album/add-photos',{id:album,photos:saved.map(item=>item.id)});
    await loadContent();if(saved.length===state.queue.length){toast(`${saved.length} bilder sparade som utkast${album?' och tillagda i albumet':''}.`);$('#upload-dialog').close();location.hash='photo';}else $('#upload-error').textContent='Några bilder kunde inte sparas. Klicka på knappen för att försöka igen med dem.';
  }catch(error){$('#upload-error').textContent=`${error.message} Sparade bilder finns kvar i bildbiblioteket.`;}
  finally{state.busy=false;$$('input,select,button',$('#upload-form')).forEach(input=>input.disabled=false);}
});
window.addEventListener('beforeunload',event=>{if(state.busy){event.preventDefault();event.returnValue='';}});
route();
try{if((await api('/api/session')).authenticated)await enter();}catch(error){$('#login-error').textContent=error.message;}
