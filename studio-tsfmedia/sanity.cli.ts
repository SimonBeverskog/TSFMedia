import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'd11tiunw',
    dataset: 'production'
  },
  typegen: {
    enabled: true,
    path: '../sportfoto/src/**/*.js',
    schema: './schema.json',
    generates: '../sportfoto/sanity.types.ts',
    overloadClientMethods: true,
  },
  deployment: {
    appId: 'ov8lihuc2bvo9o5s64mfftt4',
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: true,
  },
})
