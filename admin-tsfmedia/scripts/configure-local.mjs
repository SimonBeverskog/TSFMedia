// Accept secrets through hidden stdin, never CLI arguments.
import {writeFile} from 'node:fs/promises';
if(process.stdin.isTTY)process.stdin.setRawMode(true);
process.stdin.setEncoding('utf8');let input='';
console.log('Ready for local admin configuration JSON on stdin (input is hidden).');
process.stdin.on('data',async chunk=>{
  input+=chunk;if(!/[\r\n]/.test(input))return;process.stdin.pause();
  try{const values=JSON.parse(input.trim());const allowed=['SANITY_PROJECT_ID','SANITY_DATASET','SANITY_API_TOKEN','ADMIN_PASSWORD_HASH','SESSION_SECRET'];
    if(allowed.some(key=>typeof values[key]!=='string'||/[\r\n]/.test(values[key])))throw new Error('Ogiltig konfiguration.');
    await writeFile(new URL('../.env.local',import.meta.url),allowed.map(key=>`${key}=${values[key]}`).join('\n')+'\n',{mode:0o600});console.log('Local admin configuration saved.');process.exit(0);
  }catch{console.error('Local configuration failed.');process.exit(1);}
});
process.stdin.resume();
