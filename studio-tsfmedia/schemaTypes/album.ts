import {defineArrayMember, defineField, defineType} from 'sanity'
import {ImagesIcon} from '@sanity/icons/Images'
import {demoField, sportField, photoReference, importKeyField} from './shared'

export const album = defineType({
  name: 'album', title: 'Album / evenemang', type: 'document', icon: ImagesIcon,
  fields: [
    importKeyField,
    defineField({name: 'title', title: 'Rubrik', type: 'string', validation: rule => rule.required().max(100)}),
    defineField({name: 'subtitle', title: 'Kort beskrivning', type: 'text', rows: 2, validation: rule => rule.max(250)}),
    sportField,
    defineField({name: 'date', title: 'Evenemangsdatum', type: 'date', validation: rule => rule.required()}),
    photoReference('cover', 'Omslagsbild'),
    defineField({name: 'photos', title: 'Bilder i albumet', type: 'array', of: [defineArrayMember({type: 'reference', to: [{type: 'photo'}]})], description: 'Dra för att ändra ordningen. Publicera bilderna före albumet. Använd Ladda upp bilder för flera filer samtidigt.', validation: rule => rule.required().min(1).max(100).unique()}),
    demoField,
  ],
  preview: {select: {title: 'title', subtitle: 'sport.title', media: 'cover.image'}},
  orderings: [{title: 'Nyast först', name: 'dateDesc', by: [{field: 'date', direction: 'desc'}]}],
})
