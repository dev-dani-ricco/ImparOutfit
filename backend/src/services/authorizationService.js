import { query } from '../config/db.js';
import { HttpError } from '../utils/http.js';

export function authorizePersonal(auth, resource, { conceal = true } = {}) {
  if (!auth?.personId) throw new HttpError(401, 'Autenticação necessária');
  if (!resource || resource.person_id !== auth.personId) throw new HttpError(conceal ? 404 : 403, conceal ? 'Recurso não encontrado' : 'Acesso negado');
  return resource;
}

export async function authorizeCapability(auth, organizationId, capability, resourceId = null, db = { query }) {
  if (!auth?.personId) throw new HttpError(401, 'Autenticação necessária');
  const grant = (await db.query(`SELECT g.id FROM memberships m JOIN grants g ON g.membership_id=m.id
    JOIN organizations o ON o.id=m.organization_id AND o.status='ACTIVE'
    WHERE m.person_id=$1 AND m.organization_id=$2 AND m.status='ACTIVE'
      AND g.capability_code=$3 AND g.revoked_at IS NULL AND (g.expires_at IS NULL OR g.expires_at>now())
      AND (g.resource_id IS NULL OR g.resource_id=$4) LIMIT 1`, [auth.personId, organizationId, capability, resourceId])).rows[0];
  if (!grant) throw new HttpError(403, 'Capacidade não concedida neste contexto');
}

export const requireCapability = capability => async (req, _res, next) => {
  try {
    const requested = req.params.storeId || req.get('X-Organization-Id');
    let store;
    if (requested) {
      store = (await query('SELECT id,organization_id FROM stores WHERE id=$1 OR organization_id=$1', [requested])).rows[0];
    } else {
      const rows = (await query(`SELECT s.id,s.organization_id FROM stores s JOIN memberships m ON m.organization_id=s.organization_id
        JOIN organizations o ON o.id=m.organization_id AND o.status='ACTIVE'
        WHERE m.person_id=$1 AND m.status='ACTIVE'`, [req.auth.personId])).rows;
      if (rows.length > 1) throw new HttpError(400, 'Informe X-Organization-Id');
      store = rows[0];
    }
    if (!store) throw new HttpError(403, 'Contexto comercial indisponível');
    await authorizeCapability(req.auth, store.organization_id, capability, store.id);
    req.context = { organizationId: store.organization_id, storeId: store.id };
    next();
  } catch (error) { next(error); }
};

export async function grantBundle(db, membershipId, bundle, actorPersonId) {
  const caps = (await db.query('SELECT capability_code FROM bundle_capabilities WHERE bundle_code=$1', [bundle])).rows;
  if (!caps.length) throw new HttpError(400, 'Bundle desconhecido');
  for (const cap of caps) await db.query(`INSERT INTO grants(membership_id,capability_code,granted_by_person_id,source_bundle)
    VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING`, [membershipId, cap.capability_code, actorPersonId, bundle]);
}
