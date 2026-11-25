export const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderBody(blocks) {
  // Only schema-supported markup is emitted; CMS text is always escaped.
  let list = '';
  let html = '';
  for (const block of blocks) {
    if (typeof block === 'string') {if (list) {html += `</${list}>`; list = '';} html += `<p>${escape(block)}</p>`; continue;}
    if (block._type !== 'block') continue;
    const content = (block.children || []).map(span => {
      let text = escape(span.text).replace(/\n/g, '<br>');
      if (span.marks?.includes('strong')) text = `<strong>${text}</strong>`;
      if (span.marks?.includes('em')) text = `<em>${text}</em>`;
      return text;
    }).join('');
    const nextList = block.listItem === 'bullet' ? 'ul' : block.listItem === 'number' ? 'ol' : '';
    if (list !== nextList) {if (list) html += `</${list}>`; if (nextList) html += `<${nextList}>`; list = nextList;}
    const tag = list ? 'li' : ['h3', 'blockquote'].includes(block.style) ? block.style : 'p';
    html += `<${tag}>${content}</${tag}>`;
  }
  return html + (list ? `</${list}>` : '');
}

export function applyPageContent({settings: s, home: h, photos, events}) {
  const $ = selector => document.querySelector(selector);
  const text = (selector, value) => {if ($(selector)) $(selector).textContent = value ?? '';};
  const image = (selector, key) => {
    const element = $(selector);
    const photo = photos[key];
    element.parentElement.hidden = !photo;
    if (photo) {element.src = photo.src; element.alt = photo.alt;}
    return photo;
  };
  document.title = s.siteTitle;
  $('meta[name="description"]').content = s.description;
  document.querySelectorAll('.brand').forEach(el => {el.innerHTML = `<span>${escape(s.brandName)}<span class="brand-sub">${escape(s.brandLine)}</span></span>`; el.setAttribute('aria-label', `${s.brandName} ${s.brandLine}, startsida`);});
  $('#navigation').innerHTML = (s.navigation || []).filter(n => ['evenemang', 'om', 'nyheter', 'kontakt'].includes(n.target)).map(n => `<a href="#${n.target}">${escape(n.label)}</a>`).join('');
  text('.photographer-label', `${s.name} / ${s.role}`);
  text('.hero-copy>.eyebrow', h.hero?.eyebrow);
  $('#hero-title').innerHTML = `${escape(h.hero?.title)}<br><span>${escape(h.hero?.accent)}</span>`;
  text('.hero-intro', h.hero?.intro);
  $('.hero-copy>.button').innerHTML = `${escape(h.hero?.button)}<svg class="icon"><use href="#i-camera"/></svg>`;
  text('.hero-tag', h.hero?.tag);
  const heroPhoto = image('.hero-visual>img', h.heroPhoto);
  text('.hero-visual>.photo-label', `${h.hero?.imageLabel || ''}${heroPhoto?.demo ? ' / EXEMPELBILD' : ''}`);
  text('.digest-heading>.eyebrow', h.digest?.eyebrow);
  text('.digest-heading>h2', h.digest?.title);
  text('.digest-contact>.eyebrow', h.digest?.contactEyebrow);
  text('.digest-hello', h.digest?.contactLabel);
  const featured = events.find(e => e.id === h.featuredAlbum) || events[0];
  $('.digest-album').hidden = !featured;
  if (featured) {
    $('.digest-album').dataset.featuredEvent = featured.id;
    $('.digest-album').setAttribute('aria-label', `Öppna albumet ${featured.title}`);
    $('.digest-album').innerHTML = `<img src="${escape(photos[featured.cover].card || photos[featured.cover].src)}" alt="" width="180" height="120" loading="lazy"><span>${escape(featured.title)}<small>${featured.demo ? 'Exempelalbum' : 'Album'} · ${escape(featured.category)}</small></span>`;
  }
  text('.events-section .section-heading .eyebrow', h.archive?.eyebrow);
  text('#events-title', h.archive?.title);
  text('.events-section .section-heading>p', h.archive?.intro);
  const hasDemo = Object.values(photos).some(p => p.demo) || events.some(e => e.demo);
  text('.archive-status>p:last-child', hasDemo ? 'BILDARKIV / INNEHÅLLER EXEMPEL' : 'BILDARKIV');
  $('.demo-note').hidden = !s.demoMode;
  const aboutPhoto = image('.about-photo>img', h.aboutPhoto);
  text('.about-photo>.photo-label', `${h.about?.imageLabel || ''}${aboutPhoto?.demo ? ' / EXEMPELBILD' : ''}`);
  text('.about-copy>.eyebrow', h.about?.eyebrow);
  text('#about-title', h.about?.title);
  text('.about-copy>.large-copy', h.about?.lead);
  text('.about-copy>p:not(.eyebrow):not(.large-copy)', h.about?.body);
  $('.about-copy>.text-link').innerHTML = `<svg class="icon"><use href="#i-instagram"/></svg>Följ ${escape(s.instagramLabel)}`;
  text('.news-section .eyebrow', h.newsSection?.eyebrow);
  text('#news-title', h.newsSection?.title);
  text('.section-aside', h.newsSection?.intro);
  text('.contact-layout>div>.eyebrow', h.contact?.eyebrow);
  $('#contact-title').innerHTML = `${escape(h.contact?.title)}<br><em>${escape(h.contact?.accent)}</em>`;
  text('.contact-layout>div>p:not(.eyebrow)', h.contact?.intro);
  $('.contact-layout>div>.button').innerHTML = `<svg class="icon"><use href="#i-mail"/></svg>${escape(h.contact?.button)}`;
  $('.contact-name').innerHTML = `${escape(s.name)}<span>${escape(s.role)} · ${escape(s.brandName)} ${escape(s.brandLine)}</span>`;
  text('.contact-hint', h.contact?.hint);
  text('.contact-row [data-instagram]', s.instagramLabel);
  document.querySelectorAll('[data-email]:not(.button)').forEach(el => {el.textContent = s.email;});
  text('.footer-main>p', s.footerLine);
  $('.footer-bottom>span:first-child').innerHTML = `© <span id="copyright-year">${new Date().getFullYear()}</span> ${escape(s.name)}`;
  text('.footer-bottom>span:nth-child(2)', s.demoMode ? 'Webbplatsförslag · Exempelbilder' : s.role);
  text('#credits-dialog>.eyebrow', s.demoMode ? 'OM DETTA FÖRSLAG' : 'OM BILDERNA');
  text('#credits-dialog>p:not(.eyebrow)', s.demoMode ? 'Det här är ett webbplatsförslag. Album, datum och nyhetstexter kan vara demoinnehåll. Exempelbilder är märkta och är inte fotograferade av Tobbe.' : `Fotografier av ${s.name}, om ingen annan upphovsperson anges. Kontakta fotografen för frågor om användning.`);
  text('#credits-dialog>p:last-child', 'Frågor och förfrågningar öppnas i din e-postapp. Webbplatsen använder inga analysverktyg eller spårningskakor. Bilder och publicerat innehåll hämtas från Sanity.');
  const noscript = $('noscript');
  if (noscript) noscript.remove();
}
