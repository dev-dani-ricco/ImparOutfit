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

async function externalIdentity(client, personId) {
  const existing = (await client.query(
    'SELECT external_user_id FROM avatar_provider_identities WHERE person_id=$1 AND provider=$2',
    [personId, 'AVATURN'],
  )).rows[0];

  if (existing?.external_user_id) return existing.external_user_id;

  const created = await createAvaturnUser();
  await client.query(
    'INSERT INTO avatar_provider_identities(person_id,provider,external_user_id) ' +
    'VALUES($1,$2,$3) ' +
    'ON CONFLICT(person_id,provider) DO UPDATE SET ' +
    'external_user_id=EXCLUDED.external_user_id, updated_at=now()',
    [personId, 'AVATURN', created.id],
  );
  return created.id;
}

export async function realisticSession(req, res) {
  if (!avaturnConfigured()) {
    throw new HttpError(503, 'Avatar realista indisponível neste ambiente', {
      code: 'PROVIDER_UNAVAILABLE',
    });
  }

  const { value, error } = sessionSchema.validate(req.body || {}, { stripUnknown: true });
  if (error) throw new HttpError(400, error.message);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const providerUserId = await externalIdentity(client, req.auth.personId);
    await client.query('COMMIT');

    const session = await createAvaturnSession(providerUserId, {
      avatarId: value.avatarId || null,
    });

    res.json({
      provider: 'AVATURN',
      sessionId: session.id,
      url: session.url,
      shortLived: true,
    });
  } catch (providerError) {
    await client.query('ROLLBACK').catch(() => {});
    if (providerError instanceof HttpError) throw providerError;
    throw new HttpError(502, 'Não foi possível iniciar o provedor de avatar realista', {
      code: 'PROVIDER_UPSTREAM_ERROR',
    });
  } finally {
    client.release();
  }
}
