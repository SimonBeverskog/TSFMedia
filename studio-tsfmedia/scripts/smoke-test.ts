import assert from 'node:assert/strict'
import {getCliClient} from 'sanity/cli'
import {loadPublishedContent} from '../../sportfoto/src/sanity.js'

const client = getCliClient({apiVersion: '2026-11-25'}).withConfig({useCdn: false, perspective: 'raw'})
const created: string[] = []
async function main() {
  try {
    const source = await client.fetch<{image: unknown; sport: unknown}>('*[_type == "photo" && !(_id in path("drafts.**"))][0]{image,sport}')
    assert(source?.image, 'En publicerad bild behövs för kontrollen')
    const photo = await client.create({_id: 'drafts.', _type: 'photo', title: 'Teknisk kontroll — utkast',
      alt: 'Tillfälligt bildutkast för kontroll av publiceringsflödet', image: source.image, sport: source.sport,
      date: '2026-11-25', display: 'standalone', author: 'Tobbe Bengtson', demo: true})
    created.push(photo._id)
    assert(photo._id.startsWith('drafts.'))
    const id = photo._id.slice('drafts.'.length)
    const album = await client.create({_id: 'drafts.', _type: 'album', title: 'Teknisk kontroll — utkast',
      sport: source.sport, date: '2026-11-25', photos: [], demo: true})
    created.push(album._id)
    await client.patch(album._id).append('photos', [{_key: 'test-reference', _type: 'reference', _ref: id,
      _weak: true, _strengthenOnPublish: {type: 'photo'}}]).commit()
    const stored = await client.getDocument<{photos: {_ref: string}[]}>(album._id)
    assert.equal(stored?.photos[0]._ref, id)
    const website = await loadPublishedContent({useCdn: false})
    assert(!website.photos[id], 'Bildutkast får inte visas på hemsidan')
    assert(!website.events.some((event: {id: string}) => event.id === album._id.slice('drafts.'.length)), 'Albumutkast får inte visas på hemsidan')
    console.log('OK: API-genererade utkast, albumreferenser och den publika hemsidans utkastfiltrering.')
  } finally {
    for (const id of [...created].reverse()) {
      assert(id.startsWith('drafts.'), 'Endast kontrollens egna utkast får tas bort')
      await client.delete(id)
    }
  }
}
main().catch(error => {console.error(error.message); process.exitCode = 1})
