import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { HttpError } from '../utils/http.js';

export const tokenOptions = { algorithms: ['HS256'], issuer: 'universo-impar', audience: 'universo-impar-app' };
export function assertAuthConfig() {
  if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET) < 32 || /change.?me|your.?secret/i.test(process.env.JWT_SECRET)) throw new Error('JWT_SECRET must be a non-placeholder secret with at least 32 bytes');
}
export async function requireAuth(req, _res, next) {
  const match = /^Bearer ([^ ]+)$/.exec(req.headers.authorization || '');
  if (!match) return next(new HttpError(401, 'Token ausente'));
  let claims;
  try {
    claims = jwt.verify(match[1], process.env.JWT_SECRET, tokenOptions);
    if (typeof claims.sub !== 'string' || !/^[0-9a-f-]{36}$/i.test(claims.sub) || !Number.isInteger(claims.ver)) throw new Error('claims');
  } catch { return next(new HttpError(401, 'Token inválido')); }
  try {
    const account = (await query("SELECT id,person_id,token_version FROM accounts WHERE id=$1 AND status='ACTIVE'", [claims.sub])).rows[0];
    if (!account || account.token_version !== claims.ver) throw new HttpError(401, 'Sessão expirada');
    req.auth = { accountId: account.id, personId: account.person_id };
    req.user = { id: account.id }; // Temporary adapter for profile/plans/follows. No role claim.
    next();
  } catch (error) { next(error); }
}
