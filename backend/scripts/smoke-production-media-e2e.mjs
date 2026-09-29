import { randomBytes } from 'node:crypto';
import sharp from 'sharp';

const base = String(process.env.SMOKE_BASE_URL || 'https://impar-outfit-api.vercel.app/api').replace(/\/$/, '');
const suffix = randomBytes(5).toString('hex');
const email = `smoke-media-${suffix}@example.com`;
const password = `SmokeMedia-${randomBytes(12).toString('hex')}!A9`;

async function json(path, { method = 'GET', token, body, form } = {}) {
  const response = await fetch(base + path, {
    method,
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: form || (body ? JSON.stringify(body) : undefined),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`${method} ${path} -> ${response.status} ${JSON.stringify(payload)}`);
  }
  return payload;
}

const registered = await json('/auth/register', {
  method: 'POST',
  body: { name: 'Smoke Media E2E', email, password, profileType: 'PERSON' },
});
if (!registered.token) throw new Error('REGISTER_TOKEN_MISSING');

const image = await sharp({
  create: { width: 12, height: 12, channels: 3, background: '#d8c8b8' },
}).jpeg().toBuffer();
const form = new FormData();
form.set('photo', new Blob([image], { type: 'image/jpeg' }), 'smoke.jpg');

const uploaded = await json('/profile/photo', {
  method: 'POST',
  token: registered.token,
  form,
});
if (!uploaded.profilePhotoUrl) throw new Error('PROFILE_PHOTO_URL_MISSING');

const mediaId = uploaded.profilePhotoUrl.split('/').at(-1);
const access = await json(`/media/${mediaId}/access`, {
  method: 'POST',
  token: registered.token,
});
if (!access.url || access.requiresAuthorization !== false) {
  throw new Error('SIGNED_PRIVATE_MEDIA_ACCESS_MISSING');
}
const signedResponse = await fetch(access.url);
if (!signedResponse.ok) throw new Error(`SIGNED_MEDIA_READ_${signedResponse.status}`);
const bytes = Buffer.from(await signedResponse.arrayBuffer());
const metadata = await sharp(bytes).metadata();
if (metadata.format !== 'webp') throw new Error(`EXPECTED_WEBP_GOT_${metadata.format}`);

const me = await json('/auth/me', { token: registered.token });
if (me.email !== email) throw new Error('NEON_IDENTITY_MISMATCH');

console.log('PUBLIC_API_E2E=PASS');
console.log('NEON_IDENTITY=PASS');
console.log('PRIVATE_MEDIA_UPLOAD=PASS');
console.log('SIGNED_MEDIA_ACCESS=PASS');
console.log('SIGNED_MEDIA_READ=PASS');
console.log('MEDIA_FORMAT=webp');
console.log(`SMOKE_ACCOUNT=${email}`);
console.log(`SMOKE_MEDIA_ID=${mediaId}`);
