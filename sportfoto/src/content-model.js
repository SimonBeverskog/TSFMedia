// Shared by the public reader, build snapshot and content checks.
export function normalizeContent(data, imageUrl) {
  if (!data?.settings || !data?.home) throw new Error('Sidinställningar eller startsida saknas i Sanity.');
  const photos = Object.fromEntries((data.photos || []).filter(p => p.image?.asset && p.alt).map(p => [p._id, {
    src: imageUrl(p.image, 1800),
    thumbnail: imageUrl(p.image, 160),
    card: imageUrl(p.image, 900),
    alt: p.alt,
    title: p.title || p.alt,
    author: p.author || data.settings.name,
    source: p.source || '',
    category: p.category || '',
    date: p.date || '',
    standalone: p.display === 'standalone' && !!p.category && /^\d{4}-\d{2}-\d{2}$/.test(p.date || ''),
    demo: p.demo === true,
  }]));
  const events = (data.albums || []).map(a => ({
    id: a._id, title: a.title, category: a.category, date: a.date,
    subtitle: a.subtitle || '', demo: a.demo === true,
    cover: photos[a.cover] ? a.cover : a.photos?.find(id => photos[id]),
    photos: (a.photos || []).filter(id => photos[id]),
  })).filter(a => a.title && a.category && /^\d{4}-\d{2}-\d{2}$/.test(a.date || '') && a.cover && a.photos.length);
  const news = (data.news || []).filter(n => n.title && n.publishedAt && Date.parse(n.publishedAt) <= Date.now()).map(n => ({
    id: n._id, title: n.title, category: n.category || 'AKTUELLT',
    excerpt: n.excerpt || '', body: n.body || [], demo: n.demo === true,
    photo: photos[n.photo] ? n.photo : null,
  }));
  return {
    settings: data.settings, home: data.home, photos, events, news,
    sports: (data.sports || []).map(s => s.title).filter(Boolean),
    photographer: {name: data.settings.name, email: data.settings.email, instagram: data.settings.instagram},
  };
}
