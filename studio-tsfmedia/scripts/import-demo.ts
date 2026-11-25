// Import the already-public client demo once; never overwrite an editor's work.
import {getCliClient} from 'sanity/cli'
import {readFile} from 'node:fs/promises'
import {photographer, sports, photos, events, news} from '../../sportfoto/dist/content.js'
import {settings, home} from '../../sportfoto/dist/page-content.js'

const client = getCliClient({apiVersion: '2026-11-25'}).withConfig({useCdn: false, perspective: 'raw'})
const ref = (id: string) => ({_type: 'reference', _ref: id})

async function main() {
  const unmarked = await client.fetch<number>('count(*[_type in ["sport", "photo", "album", "news"] && !defined(importKey)])')
  if (unmarked) throw new Error('Datasetet innehåller redan redaktionellt innehåll. Demoimporten avbryts för att inte blanda in exempel.')
  async function ensure(importKey: string, document: Record<string, unknown>) {
    const existing = await client.fetch<{_id: string} | null>('*[importKey == $key && !(_id in path("drafts.**"))][0]{_id}', {key: importKey})
    return existing || client.create({...document, importKey, _type: document._type as string})
  }
  const sportIds = new Map<string, string>()
  for (const [index, title] of sports.entries()) {
    const doc = await ensure(`demo-sport:${title}`, {_type: 'sport', title, sortOrder: index * 10})
    sportIds.set(title, doc._id)
  }
  const photoIds = new Map<string, string>()
  for (const [key, photo] of Object.entries(photos)) {
    const existing = await client.fetch<{_id: string} | null>('*[importKey == $key][0]{_id}', {key: `demo-photo:${key}`})
    if (existing) {photoIds.set(key, existing._id); continue}
    const asset = await client.assets.upload('image', await readFile(new URL(`../../sportfoto/dist/${photo.src}`, import.meta.url)), {filename: `${key}.jpg`})
    const category = key.startsWith('football') ? 'Fotboll' : key === 'hockey' ? 'Ishockey' : 'Friidrott'
    const doc = await ensure(`demo-photo:${key}`, {_type: 'photo', title: key, alt: photo.alt,
      image: {_type: 'image', asset: ref(asset._id)}, sport: ref(sportIds.get(category)!),
      date: '2026-11-21', display: 'album', author: photo.author, source: photo.source, demo: true})
    photoIds.set(key, doc._id)
  }
  const albumIds = new Map<string, string>()
  for (const event of events) {
    const doc = await ensure(`demo-album:${event.id}`, {_type: 'album', title: event.title, subtitle: event.subtitle,
      sport: ref(sportIds.get(event.category)!), date: event.date, cover: ref(photoIds.get(event.cover)!),
      photos: event.photos.map((key, index) => ({_key: `photo-${index}`, ...ref(photoIds.get(key)!)})), demo: true})
    albumIds.set(event.id, doc._id)
  }
  for (const [index, article] of news.entries()) {
    await ensure(`demo-news:${article.id}`, {_type: 'news', title: article.title, category: article.category,
      excerpt: article.excerpt, photo: ref(photoIds.get(article.photo)!), publishedAt: `2026-11-${String(24 - index).padStart(2, '0')}T10:00:00Z`, demo: true,
      body: article.body.map((text, i) => ({_key: `paragraph-${i}`, _type: 'block', style: 'normal', markDefs: [], children: [{_key: `span-${i}`, _type: 'span', text, marks: []}]}))})
  }
  await client.createIfNotExists({_id: 'siteSettings', _type: 'siteSettings', ...settings,
    name: photographer.name, email: photographer.email, instagram: photographer.instagram})
  await client.createIfNotExists({_id: 'homePage', _type: 'homePage', ...home,
    heroPhoto: ref(photoIds.get(home.heroPhoto)!), aboutPhoto: ref(photoIds.get(home.aboutPhoto)!), featuredAlbum: ref(albumIds.get(home.featuredAlbum)!)})
  console.log(`Demoimport klar: ${sports.length} sporter, ${photoIds.size} bilder, ${albumIds.size} album och ${news.length} nyheter. Alla exempel är märkta.`)
}

main().catch(error => {console.error(error.message); process.exitCode = 1})
