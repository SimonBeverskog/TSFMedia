import {defineField, defineType} from 'sanity'
import {TagIcon} from '@sanity/icons/Tag'
import {importKeyField} from './shared'

export const sport = defineType({
  name: 'sport', title: 'Sport', type: 'document', icon: TagIcon,
  fields: [
    importKeyField,
    defineField({name: 'title', title: 'Namn', type: 'string', validation: rule => rule.required().max(40)}),
    defineField({name: 'sortOrder', title: 'Sorteringsordning', type: 'number', initialValue: 10, validation: rule => rule.required().integer().min(0)}),
  ],
  orderings: [{title: 'Sorteringsordning', name: 'sortOrder', by: [{field: 'sortOrder', direction: 'asc'}]}],
})
