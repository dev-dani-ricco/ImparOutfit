const DEFAULT_BASE = 'https://api.avaturn.me/api/v1';

function providerConfig() {
  const token = String(process.env.AVATURN_API_TOKEN || '').trim();
  const baseUrl = String(process.env.AVATURN_API_BASE || DEFAULT_BASE).replace(/\/+$/, '');
  return { token, baseUrl };
}

export function avaturnConfigured() {
  return Boolean(providerConfig().token);
}

async function avaturnRequest(path, options = {}) {
  const { token, baseUrl } = providerConfig();
  if (!token) {
    const error = new Error('AVATURN_PROVIDER_NOT_CONFIGURED');
    error.code = 'AVATURN_PROVIDER_NOT_CONFIGURED';
    throw error;
  }

  const response = await fetch(baseUrl + path, {
    ...options,
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const error = new Error('AVATURN_PROVIDER_REQUEST_FAILED');
    error.code = 'AVATURN_PROVIDER_REQUEST_FAILED';
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export async function createAvaturnUser() {
  const data = await avaturnRequest('/users/new', { method: 'POST' });
  if (!data?.id || !/^[A-Za-z0-9_-]{1,100}$/.test(data.id)) {
    const error = new Error('AVATURN_INVALID_USER_RESPONSE');
    error.code = 'AVATURN_INVALID_USER_RESPONSE';
    throw error;
  }
  return { id: data.id };
}

export async function createAvaturnSession(userId, { avatarId = null } = {}) {
  const config = avatarId
    ? { type: 'edit_existing', avatar_id: avatarId }
    : { type: 'create_or_edit_existing' };

  const data = await avaturnRequest('/sessions/new', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, config }),
  });

  let parsed;
  try {
    parsed = new URL(data?.url);
  } catch {
    parsed = null;
  }

  if (!parsed || parsed.protocol !== 'https:' || !data?.id) {
    const error = new Error('AVATURN_INVALID_SESSION_RESPONSE');
    error.code = 'AVATURN_INVALID_SESSION_RESPONSE';
    throw error;
  }

  return {
    id: String(data.id),
    url: parsed.toString(),
  };
}
