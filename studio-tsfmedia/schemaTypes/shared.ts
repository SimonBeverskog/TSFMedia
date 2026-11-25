import {defineField} from 'sanity'

export const importKeyField = defineField({name: 'importKey', type: 'string', hidden: true, readOnly: true})

export const demoField = defineField({
  name: 'demo', title: 'Exempelinnehåll', type: 'boolean', initialValue: false,
  description: 'Markera exempelbilder och exempeltexter. Märkningen följer med till hemsidan.',
})

export const sportField = defineField({
  name: 'sport', title: 'Sport', type: 'reference', to: [{type: 'sport'}],
  validation: rule => rule.required(),
})

export const photoReference = (name: string, title: string) => defineField({
  name, title, type: 'reference', to: [{type: 'photo'}],
  description: 'Välj en publicerad bild ur bildbiblioteket.',
})
