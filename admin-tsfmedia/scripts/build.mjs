import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
const root=new URL('../',import.meta.url),assets={};
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8'};
async function collect(directory,prefix='') {
  for(const entry of await readdir(directory,{withFileTypes:true})) {
    const path=`${prefix}/${entry.name}`,url=new URL(`${entry.name}${entry.isDirectory()?'/':''}`,directory);
    if(entry.isDirectory())await collect(url,path);else assets[path]={base64:(await readFile(url)).toString('base64'),type:mime[entry.name.match(/\.[^.]+$/)?.[0]]||'application/octet-stream'};
  }
}
await collect(new URL('public/',root));
await mkdir(new URL('dist/server/',root),{recursive:true});await mkdir(new URL('dist/.openai/',root),{recursive:true});
const manifest=JSON.parse(await readFile(new URL('.openai/hosting.json',root),'utf8'));
if(!manifest.project_id||manifest.static)throw new Error('En Worker-manifest med project_id krävs.');
await writeFile(new URL('dist/.openai/hosting.json',root),JSON.stringify(manifest,null,2)+'\n');
await build({stdin:{contents:`import {createHandler} from './src/handler.js';const entries=${JSON.stringify(assets)};const assets=Object.fromEntries(Object.entries(entries).map(([path,asset])=>[path,{type:asset.type,body:Uint8Array.from(atob(asset.base64),c=>c.charCodeAt(0))}]));const handler=createHandler({assets});export default {fetch:handler};`,resolveDir:fileURLToPath(root),sourcefile:'worker-entry.js',loader:'js'},outfile:fileURLToPath(new URL('dist/server/index.js',root)),bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true});
console.log(`Byggt serverpaket med ${Object.keys(assets).length} statiska tillgångar. Inga runtime-hemligheter ingår.`);
