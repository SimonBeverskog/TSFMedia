const encoder = new TextEncoder();
const decoder = new TextDecoder();
const lifetime = 8 * 60 * 60;
const failures = new Map();
const bytesToBase64 = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromBase64 = value => Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));

export async function passwordHash(password, salt = crypto.getRandomValues(new Uint8Array(16))) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000}, key, 256);
  return `pbkdf2$100000$${bytesToBase64(salt)}$${bytesToBase64(bits)}`;
}
export async function verifyPassword(password, stored) {
  if (typeof password !== 'string' || password.length > 256 || !stored?.startsWith('pbkdf2$100000$')) return false;
  try {
    const candidate = await passwordHash(password, fromBase64(stored.split('$')[2]));
    const a = encoder.encode(candidate), b = encoder.encode(stored);
    if (a.length !== b.length) return false;
    let difference = 0;
    for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
    return difference === 0;
  } catch {return false;}
}
async function signingKey(env) {
  return crypto.subtle.importKey('raw', encoder.encode(`${env.SESSION_SECRET}:${env.ADMIN_PASSWORD_HASH}`), {name: 'HMAC', hash: 'SHA-256'}, false, ['sign', 'verify']);
}
function cookieName(request) {return new URL(request.url).protocol === 'https:' ? '__Host-tsf_admin' : 'tsf_admin';}
export async function createSession(request, env) {
  const now = Math.floor(Date.now() / 1000);
  const payload = bytesToBase64(encoder.encode(JSON.stringify({iat: now, exp: now + lifetime, v: 1})));
  const signature = await crypto.subtle.sign('HMAC', await signingKey(env), encoder.encode(payload));
  return `${cookieName(request)}=${payload}.${bytesToBase64(signature)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${lifetime}${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`;
}
export function clearSession(request) {
  return `${cookieName(request)}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`;
}
export async function authenticated(request, env) {
  try {
    const name = cookieName(request);
    const value = request.headers.get('cookie')?.split(';').map(v => v.trim()).find(v => v.startsWith(`${name}=`))?.slice(name.length + 1);
    if (!value || value.length > 1000) return false;
    const [payload, signature, extra] = value.split('.');
    if (extra || !signature || !await crypto.subtle.verify('HMAC', await signingKey(env), fromBase64(signature), encoder.encode(payload))) return false;
    const claims = JSON.parse(decoder.decode(fromBase64(payload)));
    const now = Math.floor(Date.now() / 1000);
    return claims.v === 1 && Number.isInteger(claims.exp) && Number.isInteger(claims.iat) && claims.exp > now && claims.iat <= now && claims.exp - claims.iat === lifetime;
  } catch {return false;}
}
// Per-instance throttling supplements the generated strong shared password.
// Use a shared limiter when scaling the portal to many instances/users.
export function loginLimit(key, failed = false) {
  const now = Date.now();
  for (const [id, entry] of failures) if (entry.until < now) failures.delete(id);
  const entry = failures.get(key) || {count: 0, until: now + 10 * 60 * 1000};
  if (failed) {if(failures.size>=4096&&!failures.has(key))failures.delete(failures.keys().next().value);entry.count++; failures.set(key, entry);}
  return entry.count >= 10;
}
export function resetLoginLimit(key) {failures.delete(key);}
