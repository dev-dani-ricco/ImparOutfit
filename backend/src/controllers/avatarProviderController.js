import Joi from 'joi';
import { pool } from '../config/db.js';
import { HttpError } from '../utils/http.js';
import {
  avaturnConfigured,
  createAvaturnSession,
  createAvaturnUser,
} from '../services/avatarProviderService.js';

const sessionSchema = Joi.object({
  avatarId: Joi.string().pattern(/^[A-Za-z0-9_-]{1,160}$/).allow(null),
}).unknown(false);

async function resolveExternalIdentity(personId) {
  const client = await pool.connect();
  const lockKey = 'AVATURN:' + personId;
  try {
    await client.query('SELECT pg_advisory_lock(hashtextextended($1,0))', [lockKey]);
    const existing = (await client.query(
      'SELECT external_user_id FROM avatar_provider_identities WHERE person_id=$1 AND provider=$2',
      [personId, 'AVATURN'],
    )).rows[0];
    if (existing?.external_user_id) return existing.external_user_id;

    const created = await createAvaturnUser();
    await client.query(
      'INSERT INTO avatar_provider_identities(person_id,provider,external_user_id) ' +
      'VALUES($1,$2,$3) ON CONFLICT(person_id,provider) DO NOTHING',
      [personId, 'AVATURN', created.id],
    );

    const stored = (await client.query(
      'SELECT external_user_id FROM avatar_provider_identities WHERE person_id=$1 AND provider=$2',
      [personId, 'AVATURN'],
    )).rows[0];
    if (!stored?.external_user_id) throw new Error('AVATURN_IDENTITY_PERSIST_FAILED');
    return stored.external_user_id;
  } finally {
    await client.query('SELECT pg_advisory_unlock(hashtextextended($1,0))', [lockKey]).catch(() => {});
    client.release();
  }
}

export async function realisticSession(req, res) {
  if (!avaturnConfigured()) {
    throw new HttpError(503, 'Avatar realista indisponível neste ambiente', {
      code: 'PROVIDER_UNAVAILABLE',
    });
  }

  const { value, error } = sessionSchema.validate(req.body || {}, { stripUnknown: true });
  if (error) throw new HttpError(400, error.message);

  try {
    const providerUserId = await resolveExternalIdentity(req.auth.personId);
    const session = await createAvaturnSession(providerUserId, {
      avatarId: value.avatarId || null,
    });

    res.set('Cache-Control', 'private, no-store').json({
      provider: 'AVATURN',
      sessionId: session.id,
      url: session.url,
      shortLived: true,
    });
  } catch (providerError) {
    if (providerError instanceof HttpError) throw providerError;
    throw new HttpError(502, 'Não foi possível iniciar o provedor de avatar realista', {
      code: 'PROVIDER_UPSTREAM_ERROR',
    });
  }
}
