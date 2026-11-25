import {defineArrayMember, defineField, defineType} from 'sanity'
import {CogIcon} from '@sanity/icons/Cog'

export const siteSettings = defineType({
  name: 'siteSettings', title: 'Kontakt & sidinställningar', type: 'document', icon: CogIcon,
  groups: [{name: 'contact', title: 'Kontakt', default: true}, {name: 'website', title: 'Webbplats'}, {name: 'navigation', title: 'Meny'}],
  fields: [
    defineField({name: 'name', title: 'Fotografens namn', type: 'string', group: 'contact', validation: rule => rule.required()}),
    defineField({name: 'role', title: 'Yrkesroll', type: 'string', group: 'contact', initialValue: 'Fotograf'}),
    defineField({name: 'email', title: 'E-post', type: 'string', group: 'contact', validation: rule => rule.required().email()}),
    defineField({name: 'instagram', title: 'Instagram-länk', type: 'url', group: 'contact', validation: rule => rule.required().uri({scheme: ['https']})}),
    defineField({name: 'instagramLabel', title: 'Instagram-namn', type: 'string', group: 'contact', validation: rule => rule.required()}),
    defineField({name: 'brandName', title: 'Logotyp, första raden', type: 'string', group: 'website', validation: rule => rule.required().max(25)}),
    defineField({name: 'brandLine', title: 'Logotyp, andra raden', type: 'string', group: 'website', validation: rule => rule.required().max(35)}),
    defineField({name: 'siteTitle', title: 'Sidtitel i webbläsaren', type: 'string', group: 'website', validation: rule => rule.required().max(100)}),
    defineField({name: 'description', title: 'Beskrivning av webbplatsen', type: 'text', rows: 3, group: 'website', validation: rule => rule.required().max(250)}),
    defineField({name: 'footerLine', title: 'Text i sidfoten', type: 'string', group: 'website'}),
    defineField({name: 'demoMode', title: 'Webbplatsförslag med exempelinnehåll', type: 'boolean', group: 'website', initialValue: true, description: 'Styr den övergripande demotexten. Enskilda bilder och album behåller alltid sin egen exempelmärkning.'}),
    defineField({name: 'navigation', title: 'Menylänkar', type: 'array', group: 'navigation', of: [defineArrayMember({name: 'navigationLink', title: 'Menylänk', type: 'object', icon: CogIcon, fields: [defineField({name: 'label', title: 'Länktext', type: 'string', validation: rule => rule.required()}), defineField({name: 'target', title: 'Avsnitt', type: 'string', options: {list: [{title: 'Evenemang', value: 'evenemang'}, {title: 'Om fotografen', value: 'om'}, {title: 'Nyheter', value: 'nyheter'}, {title: 'Kontakt', value: 'kontakt'}]}, validation: rule => rule.required()})], preview: {select: {title: 'label'}}})], validation: rule => rule.required().min(1).max(6)}),
  ],
  preview: {prepare: () => ({title: 'Kontakt & sidinställningar'})},
})
