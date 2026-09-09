import Joi from 'joi';
import { getWardrobePlan } from '../config/wardrobePlans.js';
import { query } from '../config/db.js';
import { getWardrobeCapacity, plansForClient } from '../services/wardrobePlanService.js';
import { HttpError } from '../utils/http.js';

const upgradeSchema = Joi.object({
  planId: Joi.string().valid('PLUS', 'PREMIUM').required(),
});

export async function capacity(req, res) {
  const current = await getWardrobeCapacity(req.user.id);
  res.json({ ...current, plans: plansForClient(current.plan.id, current.used) });
}

export async function requestUpgrade(req, res) {
  const { value, error } = upgradeSchema.validate(req.body);
  if (error) throw new HttpError(400, error.message);

  const current = await getWardrobeCapacity(req.user.id);
  const requested = getWardrobePlan(value.planId);
  if (requested.limit <= current.limit) {
    throw new HttpError(409, 'Escolha um plano com capacidade maior que a atual', {
      code: 'PLAN_IS_NOT_AN_UPGRADE',
    });
  }

  const request = (await query(
    `INSERT INTO wardrobe_upgrade_requests(user_id, from_plan, requested_plan)
     VALUES($1, $2, $3)
     ON CONFLICT (user_id, requested_plan) WHERE status = 'PENDING'
     DO UPDATE SET created_at = now(), from_plan = EXCLUDED.from_plan
     RETURNING id, from_plan, requested_plan, status, created_at`,
    [req.user.id, current.plan.id, requested.id]
  )).rows[0];

  res.status(202).json({
    message: 'Solicitação de upgrade recebida',
    request,
    requestedPlan: requested,
  });
}
