import {useEffect, useState} from 'react'
import {definePlugin, useClient} from 'sanity'
import {Box, Button, Card, Flex, Heading, Select, Stack, Text, TextInput} from '@sanity/ui'
import {UploadIcon} from '@sanity/icons/Upload'

type Choice = {_id: string; title: string}
type Album = Choice & {_type: 'album'; photos?: unknown[]; _rev?: string; _createdAt?: string; _updatedAt?: string}
type Upload = {file: File; status: 'waiting' | 'done' | 'error'; message?: string; id?: string}

function BulkUpload() {
  const client = useClient({apiVersion: '2026-11-25'})
  const [sports, setSports] = useState<Choice[]>([])
  const [albums, setAlbums] = useState<Choice[]>([])
  const [sport, setSport] = useState('')
  const [album, setAlbum] = useState('')
  const [display, setDisplay] = useState('album')
  const [date, setDate] = useState(new Date().toLocaleDateString('sv-SE'))
  const [queue, setQueue] = useState<Upload[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    client.fetch<{sports: Choice[]; albums: Choice[]}>(`{
      "sports": *[_type == "sport" && !(_id in path("drafts.**"))] | order(sortOrder asc){_id,title},
      "albums": *[_type == "album"] | order(date desc){_id,title}
    }`, {}, {perspective: 'raw'}).then(data => {
      if (!active) return
      setSports(data.sports)
      setAlbums([...new Map(data.albums.map(a => [a._id.replace(/^drafts\./, ''), {...a, _id: a._id.replace(/^drafts\./, '')}])).values()])
    }).catch(() => {if (active) setError('Kunde inte läsa sporter och album. Ladda om verktyget och försök igen.')})
    return () => {active = false}
  }, [client])

  async function upload() {
    setBusy(true)
    setError('')
    try {
      const settings = await client.getDocument<{name?: string}>('siteSettings')
      let draftAlbumId: string | undefined
      if (album) {
        const existing = await client.getDocuments<Album>([`drafts.${album}`, album])
        const current = existing[0] || existing[1]
        if (!current) throw new Error('Albumet finns inte längre. Ladda om verktyget.')
        if ((current.photos?.length || 0) + queue.filter(q => !q.id).length > 100) throw new Error('Albumet får innehålla högst 100 bilder. Välj färre filer eller ett annat album.')
        draftAlbumId = `drafts.${album}`
        if (!existing[0]) {
          // Create a draft without changing the version visible on the website.
          await client.createIfNotExists({_id: draftAlbumId, _type: 'album', title: current.title,
            ...Object.fromEntries(Object.entries(current).filter(([key]) => !key.startsWith('_')))})
        }
      }
      for (let i = 0; i < queue.length; i++) {
        if (queue[i].id) continue
        const item = queue[i]
        try {
          const asset = await client.assets.upload('image', item.file, {filename: item.file.name})
          const title = item.file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ')
          // The API generates the ID after this draft prefix.
          const photo = await client.create({_id: 'drafts.', _type: 'photo', title, alt: title,
            image: {_type: 'image', asset: {_type: 'reference', _ref: asset._id}},
            sport: {_type: 'reference', _ref: sport}, date, display, author: settings?.name || 'Tobbe Bengtson', demo: false})
          setQueue(previous => previous.map((q, index) => index === i ? {...q, id: photo._id, status: 'done'} : q))
          if (draftAlbumId) {
            try {
              await client.patch(draftAlbumId).setIfMissing({photos: []}).append('photos', [{
                _key: crypto.randomUUID(), _type: 'reference', _ref: photo._id.replace(/^drafts\./, ''),
                _weak: true, _strengthenOnPublish: {type: 'photo'},
              }]).commit()
            } catch {
              setQueue(previous => previous.map((q, index) => index === i ? {...q, message: 'Bildutkast sparat. Lägg till bilden i albumet manuellt.'} : q))
            }
          }
        } catch (cause) {
          setQueue(previous => previous.map((q, index) => index === i ? {...q, status: 'error', message: cause instanceof Error ? cause.message : 'Uppladdningen misslyckades.'} : q))
        }
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Uppladdningen kunde inte starta.')
    } finally {setBusy(false)}
  }

  return <Box padding={4} style={{maxWidth: 900, margin: '0 auto', overflowY: 'auto', height: '100%'}}>
    <Stack gap={5}>
      <Heading as="h1" size={3}>Ladda upp bilder</Heading>
      <Text>Välj 1–100 bilder. De sparas som utkast i bildbiblioteket.</Text>
      <Card padding={4} radius={2} tone="primary"><Text size={1}>Efter uppladdningen: granska bildbeskrivningarna och publicera bilderna i Bildbibliotek. Publicera sedan albumet. Alla uppladdade bildfiler är publika; utkast skyddar texten, inte filen.</Text></Card>
      <Stack gap={3}>
        <Text as="label" htmlFor="upload-sport">Sport</Text>
        <Select id="upload-sport" value={sport} disabled={busy} onChange={e => setSport(e.currentTarget.value)}><option value="">Välj publicerad sport</option>{sports.map(s => <option key={s._id} value={s._id}>{s.title}</option>)}</Select>
        <Text as="label" htmlFor="upload-date">Fotodatum</Text>
        <TextInput id="upload-date" type="date" value={date} disabled={busy} onChange={e => setDate(e.currentTarget.value)} />
        <Text as="label" htmlFor="upload-album">Lägg även till i album (valfritt)</Text>
        <Select id="upload-album" value={album} disabled={busy} onChange={e => setAlbum(e.currentTarget.value)}><option value="">Bara bildbiblioteket</option>{albums.map(a => <option key={a._id} value={a._id}>{a.title}</option>)}</Select>
        <Text as="label" htmlFor="upload-display">Visning i bildarkivet</Text>
        <Select id="upload-display" value={display} disabled={busy} onChange={e => setDisplay(e.currentTarget.value)}><option value="album">I album och som vald sidbild</option><option value="standalone">Även som fristående bild</option></Select>
        <Text as="label" htmlFor="upload-files">Bilder (JPEG, PNG eller WebP, högst 20 MB per fil)</Text>
        <input id="upload-files" type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e => {
          const files = Array.from(e.currentTarget.files || [])
          if (files.length > 100 || files.some(f => f.size > 20 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(f.type))) {
            setError('Välj högst 100 JPEG-, PNG- eller WebP-bilder, högst 20 MB per bild.'); setQueue([]); return
          }
          setError(''); setQueue(files.map(file => ({file, status: 'waiting'})))
        }} />
      </Stack>
      {error && <Card padding={3} tone="critical" role="alert"><Text>{error}</Text></Card>}
      <Button text={busy ? 'Laddar upp…' : 'Spara bilder som utkast'} icon={UploadIcon} tone="primary" disabled={busy || !sport || !date || !queue.some(q => !q.id)} onClick={upload} />
      <Stack gap={3} aria-live="polite">
        {queue.length > 0 && <Text>{queue.filter(q => q.id).length} av {queue.length} bilder sparade</Text>}
        {queue.map(q => <Card key={`${q.file.name}-${q.file.lastModified}-${q.file.size}`} padding={3} tone={q.status === 'error' ? 'critical' : q.id ? 'positive' : 'default'}><Flex gap={3} direction="column"><Text size={1}>{q.file.name} — {q.id ? 'Utkast sparat' : q.status === 'error' ? 'Misslyckades, kan försöka igen' : 'Väntar'}</Text>{q.message && <Text size={1}>{q.message}</Text>}</Flex></Card>)}
      </Stack>
    </Stack>
  </Box>
}

export const bulkUploadTool = definePlugin({name: 'bulk-upload', tools: [{name: 'upload', title: 'Ladda upp bilder', icon: UploadIcon, component: BulkUpload}]})
