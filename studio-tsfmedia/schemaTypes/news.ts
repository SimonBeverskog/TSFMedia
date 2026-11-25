import {defineArrayMember, defineField, defineType} from 'sanity'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {demoField, photoReference, importKeyField} from './shared'

export const news = defineType({
  name: 'news', title: 'Nyhet', type: 'document', icon: DocumentTextIcon,
  fields: [
    importKeyField,
    defineField({name: 'title', title: 'Rubrik', type: 'string', validation: rule => rule.required().max(120)}),
    defineField({name: 'category', title: 'Etikett', type: 'string', initialValue: 'AKTUELLT'}),
    defineField({name: 'publishedAt', title: 'Publiceringsdatum', type: 'datetime', initialValue: () => new Date().toISOString(), validation: rule => rule.required(), description: 'Nyheten visas tidigast vid detta datum, efter att du publicerat den.'}),
    defineField({name: 'excerpt', title: 'Ingress', type: 'text', rows: 3, validation: rule => rule.required().max(350)}),
    photoReference('photo', 'Bild (valfri)'),
    defineField({name: 'body', title: 'Nyhetstext', type: 'array', of: [defineArrayMember({type: 'block', styles: [{title: 'Brödtext', value: 'normal'}, {title: 'Mellanrubrik', value: 'h3'}, {title: 'Citat', value: 'blockquote'}], lists: [{title: 'Punktlista', value: 'bullet'}, {title: 'Numrerad lista', value: 'number'}], marks: {decorators: [{title: 'Fet', value: 'strong'}, {title: 'Kursiv', value: 'em'}], annotations: []}})], validation: rule => rule.required().min(1)}),
    demoField,
  ],
  preview: {select: {title: 'title', subtitle: 'category', media: 'photo.image'}},
  orderings: [{title: 'Nyast först', name: 'publishedAtDesc', by: [{field: 'publishedAt', direction: 'desc'}]}],
})
