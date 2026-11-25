import {createServer} from 'node:http';
import {readFileSync,statSync} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Readable} from 'node:stream';
import {createHandler} from '../src/handler.js';
const root=fileURLToPath(new URL('../public/',import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8'};
const assets=new Proxy({}, {get(_,path){if(typeof path!=='string')return;const target=resolve(root,'.'+path);if(!target.startsWith(root.endsWith(sep)?root:root+sep))return;try{if(!statSync(target).isFile())return;return {body:readFileSync(target),type:mime[extname(target)]||'application/octet-stream'};}catch{return;}}});
const handler=createHandler({assets});const port=Number(process.env.PORT||4180),host=process.env.HOST||'127.0.0.1';
createServer(async(incoming,outgoing)=>{
  try{
    const headers=new Headers();for(const [key,value]of Object.entries(incoming.headers))if(value!==undefined)headers.set(key,Array.isArray(value)?value.join(', '):value);
    headers.set('x-tsf-local-ip',incoming.socket.remoteAddress||'local');
    const request=new Request(`http://${incoming.headers.host}${incoming.url}`,{method:incoming.method,headers,...(!['GET','HEAD'].includes(incoming.method)?{body:Readable.toWeb(incoming),duplex:'half'}:{})});
    const response=await handler(request,process.env);outgoing.writeHead(response.status,Object.fromEntries(response.headers));
    if(response.body)Readable.fromWeb(response.body).pipe(outgoing);else outgoing.end();
  }catch{outgoing.writeHead(500,{'Content-Type':'text/plain'});outgoing.end('Serverfel.');}
}).listen(port,host,()=>console.log(`Local: http://${host}:${port}`));
