import assert from 'node:assert/strict';
import test from 'node:test';

import {
  avaturnConfigured,
  createAvaturnSession,
  createAvaturnUser,
} from '../src/services/avatarProviderService.js';

test('avatar provider stays disabled without server token', () => {
  const old = process.env.AVATURN_API_TOKEN;
  delete process.env.AVATURN_API_TOKEN;
  try {
    assert.equal(avaturnConfigured(), false);
  } finally {
    if (old !== undefined) process.env.AVATURN_API_TOKEN = old;
  }
});

test('avatar provider creates anonymous user and HTTPS session', async () => {
  const oldToken = process.env.AVATURN_API_TOKEN;
  const oldBase = process.env.AVATURN_API_BASE;
  const oldFetch = globalThis.fetch;
  process.env.AVATURN_API_TOKEN = 'test-token';
  process.env.AVATURN_API_BASE = 'https://provider.example/api/v1';

  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).endsWith('/users/new')) {
      return new Response(JSON.stringify({ id: 'provider-user-1' }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    if (String(url).endsWith('/sessions/new')) {
      return new Response(JSON.stringify({ id: 'session-1', url: 'https://studio.example/session-1' }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    return new Response('{}', { status: 404 });
  };

  try {
    assert.equal(avaturnConfigured(), true);
    const user = await createAvaturnUser();
    assert.equal(user.id, 'provider-user-1');
    const session = await createAvaturnSession(user.id);
    assert.equal(session.id, 'session-1');
    assert.equal(session.url, 'https://studio.example/session-1');
    assert.equal(calls.length, 2);
    assert.equal(calls[0].options.headers.Authorization, 'Bearer test-token');
    const body = JSON.parse(calls[1].options.body);
    assert.equal(body.user_id, 'provider-user-1');
    assert.equal(body.config.type, 'create_or_edit_existing');
  } finally {
    globalThis.fetch = oldFetch;
    if (oldToken === undefined) delete process.env.AVATURN_API_TOKEN;
    else process.env.AVATURN_API_TOKEN = oldToken;
    if (oldBase === undefined) delete process.env.AVATURN_API_BASE;
    else process.env.AVATURN_API_BASE = oldBase;
  }
});

test('avatar provider rejects insecure persistent session URLs', async () => {
  const oldToken = process.env.AVATURN_API_TOKEN;
  const oldBase = process.env.AVATURN_API_BASE;
  const oldFetch = globalThis.fetch;
  process.env.AVATURN_API_TOKEN = 'test-token';
  process.env.AVATURN_API_BASE = 'https://provider.example/api/v1';
  globalThis.fetch = async () => new Response(JSON.stringify({ id: 'session-1', url: 'http://unsafe.example/session' }), { status: 200, headers: { 'content-type': 'application/json' } });

  try {
    await assert.rejects(() => createAvaturnSession('provider-user-1'), /AVATURN_INVALID_SESSION_RESPONSE/);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldToken === undefined) delete process.env.AVATURN_API_TOKEN;
    else process.env.AVATURN_API_TOKEN = oldToken;
    if (oldBase === undefined) delete process.env.AVATURN_API_BASE;
    else process.env.AVATURN_API_BASE = oldBase;
  }
});
