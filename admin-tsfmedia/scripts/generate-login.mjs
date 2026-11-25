import {passwordHash} from '../src/auth.js';
const bytes=crypto.getRandomValues(new Uint8Array(9));
const password='TSF-'+Buffer.from(bytes).toString('base64url');
console.log(JSON.stringify({password,passwordHash:await passwordHash(password),sessionSecret:Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64url')}));
