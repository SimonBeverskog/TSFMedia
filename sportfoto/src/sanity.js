import {createClient} from '@sanity/client';
import {createImageUrlBuilder} from '@sanity/image-url';
import groq, {defineQuery} from 'groq';
import {normalizeContent} from './content-model.js';

export const client = createClient({
  projectId: 'd11tiunw', dataset: 'production', apiVersion: '2026-11-25',
  useCdn: true, perspective: 'published', timeout: 5000, maxRetries: 0,
});
const images = createImageUrlBuilder(client);

// Explicit projection: only public website fields reach the static snapshot.
export const WEBSITE_QUERY = groq`{
  "settings": *[_id == "siteSettings"][0]{
    brandName, brandLine, name, role, email, instagram, instagramLabel,
    siteTitle, description, footerLine, demoMode, navigation[]{_key, label, target}
  },
  "home": *[_id == "homePage"][0]{
    hero, digest, archive, about, newsSection, contact,
    "heroPhoto": heroPhoto._ref, "aboutPhoto": aboutPhoto._ref,
    "featuredAlbum": featuredAlbum._ref
  },
  "sports": *[_type == "sport"] | order(sortOrder asc, title asc){_id, title},
  "photos": *[_type == "photo" && defined(image.asset)]{
    _id, title, alt, image{asset, hotspot, crop}, author, source, demo,
    date, display, "category": sport->title
  },
  "albums": *[_type == "album"] | order(date desc){
    _id, title, subtitle, date, demo, "category": sport->title,
    "cover": cover._ref, "photos": photos[]._ref
  },
  "news": *[_type == "news" && publishedAt <= now()] | order(publishedAt desc){
    _id, title, category, excerpt, body, publishedAt, demo, "photo": photo._ref
  }
}`;

export async function loadPublishedContent({useCdn = true} = {}) {
  const data = await client.withConfig({useCdn}).fetch(defineQuery(WEBSITE_QUERY), {}, {signal: AbortSignal.timeout(5000)});
  return normalizeContent(data, (image, width) => images.image(image).width(width).fit('max').auto('format').quality(85).url());
}
