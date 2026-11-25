import type {StructureResolver} from 'sanity/structure'

export const structure: StructureResolver = S => S.list().title('Tobbes sportfoton').items([
  S.listItem().singleton('siteSettings'),
  S.listItem().singleton('homePage'),
  S.divider(),
  S.documentTypeListItem('album').title('Album & evenemang'),
  S.documentTypeListItem('photo').title('Bildbibliotek'),
  S.documentTypeListItem('news').title('Nyheter'),
  S.documentTypeListItem('sport').title('Sporter'),
])
