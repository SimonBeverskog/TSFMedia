import { readFile, stat } from 'node:fs/promises';
import { photographer, sports, photos, events, news } from '../dist/content.js';
import assert from 'node:assert/strict';
const root = new URL('../dist/', import.meta.url);
const html = await readFile(new URL('index.html', root), 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'Duplicerade HTML-id:n');
for (const match of html.matchAll(/href="#([^"\s]+)"/g)) assert(ids.includes(match[1]), `Ankaret ${match[1]} saknas`);
for (const asset of ['app.js','content.js','styles.css','assets/favicon.svg',...Object.values(photos).map(p => p.src)]) assert((await stat(new URL(asset,root))).size > 0, `${asset} saknas eller är tom`);
const css = await readFile(new URL('styles.css',root),'utf8');
for (const match of css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)) assert((await stat(new URL(match[1],root))).size > 0, `CSS-tillgången ${match[1]} saknas`);
assert.equal(new Set(events.map(e => e.id)).size, events.length);
for (const event of events) { assert(sports.includes(event.category), `Okänd sport ${event.category}`); assert(event.photos.length); assert(photos[event.cover]); for (const key of event.photos) assert(photos[key], `Saknad bild ${key}`); assert(!Number.isNaN(Date.parse(event.date))); }
assert.equal(new Set(news.map(n => n.id)).size, news.length);
for (const article of news) assert(photos[article.photo], `Saknad nyhetsbild ${article.photo}`);
assert(photographer.email.includes('@'));
assert(new URL(photographer.instagram).protocol === 'https:');
console.log(`OK: ${events.length} album, ${Object.keys(photos).length} bilder, ${news.length} artiklar, tillgångar och interna länkar.`);
