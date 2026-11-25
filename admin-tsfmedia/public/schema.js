const f = (path, label, kind = 'text', required = false, extra = {}) => ({path, label, kind, required, ...extra});
export const sections = [
  {id:'dashboard', label:'Översikt', mark:'01'}, {id:'album', label:'Album & evenemang', mark:'02'},
  {id:'photo', label:'Bildbibliotek', mark:'03'}, {id:'news', label:'Nyheter', mark:'04'},
  {id:'homePage', label:'Sidans texter', mark:'05'}, {id:'siteSettings', label:'Kontakt & meny', mark:'06'},
  {id:'sport', label:'Sporter', mark:'07'},
];
export const fields = {
  sport: [f('title','Namn','text',true,{max:40}), f('sortOrder','Ordning','number',true)],
  photo: [f('title','Bildnamn','text',true),f('alt','Beskrivning av motivet','textarea',true,{max:500}),f('sport','Sport','sport',true),f('date','Fotodatum','date',true),f('display','Visning','select',true,{options:[['album','I album och som sidbild'],['standalone','Även som fristående bild']]}),f('author','Fotograf','text',true),f('source','Källänk (valfri)','url'),f('demo','Exempelbild','boolean')],
  album: [f('title','Rubrik','text',true,{max:100}),f('subtitle','Kort beskrivning','textarea',false,{max:250}),f('sport','Sport','sport',true),f('date','Evenemangsdatum','date',true),f('cover','Omslagsbild','photo'),f('demo','Exempelalbum','boolean')],
  news: [f('title','Rubrik','text',true,{max:120}),f('category','Etikett'),f('publishedAt','Visas tidigast','datetime-local',true),f('excerpt','Ingress','textarea',true,{max:350}),f('photo','Bild','photo'),f('demo','Exempeltext','boolean')],
  siteSettings: [
    f('name','Fotografens namn','text',true,{group:'Kontakt'}),f('role','Yrkesroll','text',false,{group:'Kontakt'}),f('email','E-post','email',true,{group:'Kontakt'}),f('instagram','Instagram-länk','url',true,{group:'Kontakt'}),f('instagramLabel','Instagram-namn','text',true,{group:'Kontakt'}),
    f('brandName','Logotyp, första raden','text',true,{group:'Webbplats',max:25}),f('brandLine','Logotyp, andra raden','text',true,{group:'Webbplats',max:35}),f('siteTitle','Sidtitel i webbläsaren','text',true,{group:'Webbplats',max:100}),f('description','Beskrivning av webbplatsen','textarea',true,{group:'Webbplats',max:250}),f('footerLine','Text i sidfoten','text',false,{group:'Webbplats'}),f('demoMode','Visa övergripande demomärkning','boolean',false,{group:'Webbplats'}),
  ],
  homePage: [
    ...[['eyebrow','Överrubrik'],['title','Rubrik, första raden'],['accent','Rubrik, andra raden'],['intro','Introduktion','textarea'],['button','Bokningsknapp'],['tag','Text på bilden'],['imageLabel','Bildetikett']].map(([p,l,k])=>f(`hero.${p}`,l,k||'text',true,{group:'Första intrycket'})),
    f('heroPhoto','Stor bild överst','photo',false,{group:'Första intrycket'}),
    ...[['eyebrow','Överrubrik'],['title','Rubrik','textarea'],['contactEyebrow','Kontakt, överrubrik'],['contactLabel','Kontakt, länktext']].map(([p,l,k])=>f(`digest.${p}`,l,k||'text',true,{group:'Från sidlinjen'})),
    f('featuredAlbum','Utvalt album','album',false,{group:'Från sidlinjen'}),
    ...[['eyebrow','Överrubrik'],['title','Rubrik'],['intro','Introduktion','textarea']].map(([p,l,k])=>f(`archive.${p}`,l,k||'text',true,{group:'Bildarkivet'})),
    ...[['eyebrow','Överrubrik'],['title','Rubrik'],['lead','Inledning','textarea'],['body','Brödtext','textarea'],['imageLabel','Bildetikett']].map(([p,l,k])=>f(`about.${p}`,l,k||'text',true,{group:'Om fotografen'})),
    f('aboutPhoto','Presentationsbild','photo',false,{group:'Om fotografen'}),
    ...[['eyebrow','Överrubrik'],['title','Rubrik'],['intro','Introduktion']].map(([p,l])=>f(`newsSection.${p}`,l,'text',true,{group:'Nyhetsavsnittet'})),
    ...[['eyebrow','Överrubrik'],['title','Rubrik, första raden'],['accent','Rubrik, andra raden'],['intro','Introduktion','textarea'],['button','Knapptext'],['hint','Hjälptext','textarea']].map(([p,l,k])=>f(`contact.${p}`,l,k||'text',true,{group:'Kontaktavsnittet'})),
  ],
};
export const labels = {album:'album',photo:'bild',news:'nyhet',sport:'sport',siteSettings:'sidinställningar',homePage:'sidans texter'};
export const getValue = (object, path) => path.split('.').reduce((value, key) => value?.[key], object);
export function setValue(object, path, value) {
  const parts = path.split('.'); let parent = object;
  for (const part of parts.slice(0,-1)) parent = parent[part] ||= {};
  parent[parts.at(-1)] = value;
}
