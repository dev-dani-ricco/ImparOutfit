export const WARDROBE_PLANS = Object.freeze({
  FREE: Object.freeze({ id: 'FREE', name: 'Essencial', limit: 50, priceMonthly: 0 }),
  PLUS: Object.freeze({ id: 'PLUS', name: 'Plus', limit: 150, priceMonthly: 14.9 }),
  PREMIUM: Object.freeze({ id: 'PREMIUM', name: 'Premium', limit: 500, priceMonthly: 29.9 }),
});

export const DEFAULT_WARDROBE_PLAN_ID = 'FREE';

export function getWardrobePlan(planId) {
  return WARDROBE_PLANS[planId] || WARDROBE_PLANS[DEFAULT_WARDROBE_PLAN_ID];
}

export function listWardrobePlans() {
  return Object.values(WARDROBE_PLANS);
}
