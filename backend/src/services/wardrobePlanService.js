import { getWardrobePlan, listWardrobePlans } from '../config/wardrobePlans.js';
import { query } from '../config/db.js';
import { HttpError } from '../utils/http.js';

const runner = (db) => (typeof db === 'function' ? db : db.query.bind(db));

export async function getWardrobeCapacity(userId, db = query, { lock = false } = {}) {
  const run = runner(db);
  if (lock) {
    await run('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [String(userId)]);
  }

  const row = (await run(
    `SELECT u.wardrobe_plan,
            COUNT(i.id)::int AS used
       FROM users u
       JOIN accounts a ON a.id = u.id
       LEFT JOIN wardrobe_items i
         ON i.person_id = a.person_id
      WHERE u.id = $1
      GROUP BY u.id`,
    [userId]
  )).rows[0];

  if (!row) throw new HttpError(404, 'Cliente não encontrada');
  const plan = getWardrobePlan(row.wardrobe_plan);
  const used = Number(row.used) || 0;

  return {
    plan,
    used,
    limit: plan.limit,
    available: Math.max(0, plan.limit - used),
    isFull: used >= plan.limit,
    percentage: Math.min(100, Math.round((used / plan.limit) * 100)),
  };
}

export async function requireWardrobeSlot(userId, db) {
  const capacity = await getWardrobeCapacity(userId, db, { lock: true });
  if (capacity.isFull) {
    throw new HttpError(409, 'Limite de peças do armário atingido', {
      code: 'WARDROBE_LIMIT_REACHED',
      details: capacity,
    });
  }
  return capacity;
}

export function plansForClient(currentPlanId, used) {
  const current = getWardrobePlan(currentPlanId);
  return listWardrobePlans().map((plan) => ({
    ...plan,
    current: plan.id === current.id,
    selectable: used <= plan.limit,
  }));
}
