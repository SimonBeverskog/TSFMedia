import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {schemaTypes} from './schemaTypes'
import {svSELocale} from '@sanity/locale-sv-se'
import {structure} from './structure'
import {bulkUploadTool} from './tools/bulk-upload'

export default defineConfig({
  name: 'default',
  title: 'TSFMedia',

  projectId: 'd11tiunw',
  dataset: 'production',

  plugins: [structureTool({title: 'Innehåll', structure}), bulkUploadTool(), svSELocale()],

  document: {singletons: ['siteSettings', 'homePage']},

  schema: {
    types: schemaTypes,
  },
})
