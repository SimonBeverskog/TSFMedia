import {defineField, defineType} from 'sanity'
import {HomeIcon} from '@sanity/icons/Home'
import {photoReference} from './shared'

const text = (name: string, title: string, multiline = false) => defineField({name, title, type: multiline ? 'text' : 'string', ...(multiline ? {rows: 3} : {}), validation: rule => rule.required()})
const section = (name: string, title: string, fields: ReturnType<typeof defineField>[]) => defineField({name, title, type: 'object', icon: HomeIcon, fields, validation: rule => rule.required()})

export const homePage = defineType({
  name: 'homePage', title: 'Startsida & texter', type: 'document', icon: HomeIcon,
  fields: [
    section('hero', 'Första intrycket', [text('eyebrow', 'Överrubrik'), text('title', 'Rubrik, första raden'), text('accent', 'Rubrik, andra raden'), text('intro', 'Introduktion', true), text('button', 'Bokningsknapp'), text('tag', 'Text på bilden'), text('imageLabel', 'Bildetikett')]),
    photoReference('heroPhoto', 'Stor bild överst på sidan'),
    section('digest', 'Senaste från sidlinjen', [text('eyebrow', 'Överrubrik'), text('title', 'Rubrik', true), text('contactEyebrow', 'Kontakt, överrubrik'), text('contactLabel', 'Kontakt, länktext')]),
    defineField({name: 'featuredAlbum', title: 'Utvalt album', type: 'reference', to: [{type: 'album'}], description: 'Om inget väljs visas det senaste publicerade albumet.'}),
    section('archive', 'Bildarkivet', [text('eyebrow', 'Överrubrik'), text('title', 'Rubrik'), text('intro', 'Introduktion', true)]),
    section('about', 'Om fotografen', [text('eyebrow', 'Överrubrik'), text('title', 'Rubrik'), text('lead', 'Inledande text', true), text('body', 'Brödtext', true), text('imageLabel', 'Bildetikett')]),
    photoReference('aboutPhoto', 'Bild i presentationen'),
    section('newsSection', 'Nyhetsavsnittet', [text('eyebrow', 'Överrubrik'), text('title', 'Rubrik'), text('intro', 'Introduktion')]),
    section('contact', 'Kontaktavsnittet', [text('eyebrow', 'Överrubrik'), text('title', 'Rubrik, första raden'), text('accent', 'Rubrik, andra raden'), text('intro', 'Introduktion', true), text('button', 'Knapptext'), text('hint', 'Hjälptext under kontaktuppgifterna', true)]),
  ],
  preview: {prepare: () => ({title: 'Startsida & texter'})},
})
