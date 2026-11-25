import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeContent} from '../src/content-model.js';
import {renderBody} from '../dist/render-content.js';

const photo = {_id: 'photo1', title: 'Match', alt: 'En räddning', image: {asset: {_ref: 'asset1'}}, category: 'Handboll', date: '2026-11-20'};
const fixture = {settings: {name: 'Tobbe'}, home: {}, sports: [{title: 'Handboll'}], photos: [photo], albums: [], news: []};
const normalize = value => normalizeContent(value, (_, width) => `https://cdn.sanity.io/image-${width}.jpg`);

test('an empty CMS gives real empty collections rather than demo albums', () => {
  const content = normalize({...fixture, photos: [], sports: []});
  assert.deepEqual(content.events, []); assert.deepEqual(content.news, []); assert.deepEqual(content.photos, {});
});
test('an unpublished or removed referenced photo cannot break a gallery', () => {
  const content = normalize({...fixture, albums: [{_id: 'album', title: 'Match', date: '2026-11-20', category: 'Handboll', cover: 'missing', photos: ['missing', 'photo1']}, {_id: 'empty', title: 'Empty', date: '2026-11-20', category: 'Handboll', photos: ['missing']}]});
  assert.equal(content.events.length, 1); assert.equal(content.events[0].cover, 'photo1'); assert.deepEqual(content.events[0].photos, ['photo1']);
});
test('standalone photos stay reusable and get small thumbnails', () => {
  const content = normalize({...fixture, photos: [{...photo, display: 'standalone'}]});
  assert.equal(content.photos.photo1.standalone, true); assert.match(content.photos.photo1.thumbnail, /160/);
  assert.match(content.photos.photo1.card, /900/); assert.match(content.photos.photo1.src, /1800/);
});
test('future-dated news and unavailable cover photos are handled', () => {
  const content = normalize({...fixture, news: [{_id: 'future', title: 'Later', publishedAt: '2999-01-01T00:00:00Z'}, {_id: 'past', title: 'Now', photo: 'missing', publishedAt: '2020-01-01T00:00:00Z'}]});
  assert.equal(content.news.length, 1); assert.equal(content.news[0].id, 'past'); assert.equal(content.news[0].photo, null);
});
test('rich text escapes untrusted markup and only renders supported formatting', () => {
  const html = renderBody([{_type: 'block', style: 'script', children: [{text: '<img src=x onerror=alert(1)>', marks: ['strong', 'unknown']}]}, {_type: 'image', url: 'javascript:alert(1)'}]);
  assert.equal(html, '<p><strong>&lt;img src=x onerror=alert(1)&gt;</strong></p>');
});
test('consecutive lists close before normal text', () => {
  const block = (text, listItem) => ({_type: 'block', listItem, children: [{text}]});
  assert.equal(renderBody([block('Ett', 'bullet'), block('Två', 'bullet'), block('Tre')]), '<ul><li>Ett</li><li>Två</li></ul><p>Tre</p>');
});
