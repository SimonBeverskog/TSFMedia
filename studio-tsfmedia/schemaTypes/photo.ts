import {defineField, defineType} from 'sanity'
import {ImageIcon} from '@sanity/icons/Image'
import {demoField, sportField, importKeyField} from './shared'

export const photo = defineType({
  name: 'photo', title: 'Bild', type: 'document', icon: ImageIcon,
  fields: [
    importKeyField,
    defineField({name: 'title', title: 'Bildnamn', type: 'string', validation: rule => rule.required()}),
    defineField({name: 'image', title: 'Fotografi', type: 'image', options: {hotspot: true, accept: 'image/jpeg,image/png,image/webp'}, validation: rule => rule.required()}),
    defineField({name: 'alt', title: 'Beskrivning av bilden', type: 'text', rows: 2, description: 'Beskriv motivet för den som inte kan se bilden. Visas även i bildvisningen.', validation: rule => rule.required().max(500)}),
    sportField,
    defineField({name: 'date', title: 'Fotodatum', type: 'date', validation: rule => rule.required()}),
    defineField({name: 'display', title: 'Visning i arkivet', type: 'string', initialValue: 'album', options: {list: [{title: 'I album och som vald sidbild', value: 'album'}, {title: 'Även som fristående bild', value: 'standalone'}], layout: 'radio'}, validation: rule => rule.required()}),
    defineField({name: 'author', title: 'Fotograf / upphovsperson', type: 'string', initialValue: 'Tobbe Bengtson', validation: rule => rule.required()}),
    defineField({name: 'source', title: 'Källänk (valfri)', type: 'url', validation: rule => rule.uri({scheme: ['https']})}),
    demoField,
  ],
  preview: {select: {title: 'title', subtitle: 'sport.title', media: 'image'}},
  orderings: [{title: 'Nyast först', name: 'dateDesc', by: [{field: 'date', direction: 'desc'}]}],
})
