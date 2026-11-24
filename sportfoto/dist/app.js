import { photographer, sports, photos, events, news } from './content.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const icon = name => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateFormat = new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Stockholm' });
const emailLink = (subject, body) => `mailto:${photographer.email}${subject ? `?subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ''}` : ''}`;

$$('[data-instagram]').forEach(a => { a.href = photographer.instagram; });
$$('[data-email]').forEach(a => { a.href = emailLink(a.dataset.subject); });
$('#copyright-year').textContent = new Date().getFullYear();

const menuToggle = $('.menu-toggle');
function closeMenu() {
  $('#navigation').classList.remove('is-open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Öppna menyn');
}
menuToggle.addEventListener('click', () => {
  const open = $('#navigation').classList.toggle('is-open');
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Stäng menyn' : 'Öppna menyn');
});
$$('#navigation a').forEach(a => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

let category = 'Alla';
const categories = ['Alla', ...sports];
$('.filters').innerHTML = categories.map(name => `<button class="filter-button" type="button" data-category="${escape(name)}" aria-pressed="${name === category}">${escape(name)} <span class="filter-count">${name === 'Alla' ? events.length : events.filter(e => e.category === name).length}</span></button>`).join('');
const normalized = value => value.toLocaleLowerCase('sv-SE').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
function renderEvents() {
  const query = normalized($('#event-search').value);
  const sort = $('#event-sort').value;
  const visible = events.filter(event => (category === 'Alla' || event.category === category) && normalized(`${event.title} ${event.category} ${event.subtitle} ${event.date} ${dateFormat.format(new Date(`${event.date}T12:00:00Z`))}`).includes(query));
  visible.sort((a,b) => sort === 'title' ? a.title.localeCompare(b.title, 'sv') : sort === 'oldest' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
  $('#event-grid').innerHTML = visible.map(event => {
    const photo = photos[event.cover];
    return `<article class="event-card"><button type="button" class="event-button" data-event="${escape(event.id)}" aria-label="Öppna albumet ${escape(event.title)}, ${event.photos.length} ${event.photos.length === 1 ? 'bild' : 'bilder'}"><div class="event-image"><img src="${escape(photo.src)}" alt="${escape(photo.alt)}" width="900" height="600" loading="lazy"><span class="event-category">${escape(event.category)}</span><span class="photo-count">${icon('camera')}${event.photos.length} ${event.photos.length === 1 ? 'bild' : 'bilder'}</span></div><div class="event-meta"><time datetime="${event.date}">${escape(dateFormat.format(new Date(`${event.date}T12:00:00Z`)))}</time><span aria-hidden="true"></span>Exempelalbum</div><h3>${escape(event.title)}</h3><p class="event-subtitle">${escape(event.subtitle)}</p></button></article>`;
  }).join('');
  $('#result-count').textContent = `${visible.length} evenemang${category !== 'Alla' ? ` inom ${category.toLocaleLowerCase('sv-SE')}` : ''}`;
  $('#empty-state').hidden = visible.length > 0;
  const awaitingAlbums = !query && category !== 'Alla' && !events.some(event => event.category === category);
  $('#empty-state h3').textContent = awaitingAlbums ? `Inga evenemang inom ${category.toLocaleLowerCase('sv-SE')} ännu` : 'Inga evenemang hittades';
  $('#empty-state p').textContent = awaitingAlbums ? `Bilder från ${category.toLocaleLowerCase('sv-SE')} kommer att visas här när det första albumet publiceras.` : 'Prova ett annat sökord eller välj en annan sport.';
  $$('.filter-button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.category === category)));
}
$('.filters').addEventListener('click', e => {
  const button = e.target.closest('[data-category]');
  if (!button) return;
  category = button.dataset.category;
  renderEvents();
});
$('#event-search').addEventListener('input', renderEvents);
$('#event-sort').addEventListener('change', renderEvents);
$$('[data-sport-link]').forEach(link => link.addEventListener('click', () => {
  category = link.dataset.sportLink;
  $('#event-search').value = '';
  renderEvents();
}));
$('#reset-filters').addEventListener('click', () => { category = 'Alla'; $('#event-search').value = ''; $('#event-sort').value = 'newest'; renderEvents(); $('#event-search').focus(); });
renderEvents();

const gallery = $('#gallery-dialog');
let activeEvent;
let activePhoto = 0;
function renderPhoto() {
  const key = activeEvent.photos[activePhoto];
  const photo = photos[key];
  $('#gallery-image').src = photo.src;
  $('#gallery-image').alt = photo.alt;
  $('#gallery-caption').textContent = photo.alt;
  $('#gallery-counter').textContent = `Bild ${activePhoto + 1} av ${activeEvent.photos.length} · Foto: ${photo.author} / Unsplash`;
  $('.gallery-prev').disabled = activePhoto === 0;
  $('.gallery-next').disabled = activePhoto === activeEvent.photos.length - 1;
  $('#gallery-inquiry').href = emailLink(`Bildförfrågan: ${activeEvent.title}`, `Hej Tobbe!\n\nJag har en fråga om en bild.\nAlbum: ${activeEvent.title}\nBildnamn: ${key}\n\nMin fråga:\n`);
  $('#gallery-thumbnails').innerHTML = activeEvent.photos.map((photoKey, index) => `<button type="button" class="thumbnail" data-photo="${index}" aria-label="Visa bild ${index + 1}" aria-pressed="${index === activePhoto}"><img src="${escape(photos[photoKey].src)}" alt="" width="64" height="44"></button>`).join('');
}
function openEvent(id) {
  activeEvent = events.find(event => event.id === id);
  if (!activeEvent) return;
  activePhoto = 0;
  $('#gallery-title').textContent = activeEvent.title;
  $('#gallery-category').textContent = `${activeEvent.category} / Exempelalbum`;
  renderPhoto();
  gallery.showModal();
  $('.dialog-close', gallery).focus();
}
$('#event-grid').addEventListener('click', e => { const button = e.target.closest('[data-event]'); if (button) openEvent(button.dataset.event); });
$$('[data-featured-event]').forEach(button => button.addEventListener('click', () => openEvent(button.dataset.featuredEvent)));
function movePhoto(change) {
  const next = activePhoto + change;
  if (next < 0 || next >= activeEvent.photos.length) return;
  activePhoto = next;
  renderPhoto();
}
$('.gallery-prev').addEventListener('click', () => movePhoto(-1));
$('.gallery-next').addEventListener('click', () => movePhoto(1));
gallery.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') { e.preventDefault(); movePhoto(1); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); movePhoto(-1); }
});
$('#gallery-thumbnails').addEventListener('click', e => { const button = e.target.closest('[data-photo]'); if (button) { activePhoto = Number(button.dataset.photo); renderPhoto(); $(`[data-photo="${activePhoto}"]`).focus(); } });

$('#news-grid').innerHTML = news.map(article => `<article class="news-card"><p class="eyebrow">${escape(article.category)}</p><h3>${escape(article.title)}</h3><p>${escape(article.excerpt)}</p><button class="plain-button" type="button" data-article="${escape(article.id)}" aria-label="Läs mer: ${escape(article.title)}">Läs mer</button></article>`).join('');
$('#news-grid').addEventListener('click', e => {
  const button = e.target.closest('[data-article]');
  if (!button) return;
  const article = news.find(item => item.id === button.dataset.article);
  $('#article-title').textContent = article.title;
  $('#article-category').textContent = `${article.category} / Förslag på innehåll`;
  $('#article-body').innerHTML = article.body.map(paragraph => `<p>${escape(paragraph)}</p>`).join('');
  $('#article-dialog').showModal();
});
$('#article-contact').addEventListener('click', () => $('#article-dialog').close());
$('#photo-credits').innerHTML = Object.values(photos).map(photo => `<li><a href="${escape(photo.source)}" target="_blank" rel="noopener noreferrer">${escape(photo.author)} / Unsplash</a></li>`).join('');
$('#open-credits').addEventListener('click', () => $('#credits-dialog').showModal());
$$('dialog').forEach(dialog => {
  $('.dialog-close', dialog).addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => { if (e.target === dialog) { const rect = dialog.getBoundingClientRect(); if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) dialog.close(); } });
});
