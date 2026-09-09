export const WARDROBE_PLANS = Object.freeze([
  {
    id: 'FREE',
    name: 'Essencial',
    limit: 50,
    priceMonthly: 0,
    description: 'Para começar a organizar seu estilo.',
    benefits: ['Até 50 peças', 'Fotos 2D e modelos 3D', 'Coleções pessoais'],
  },
  {
    id: 'PLUS',
    name: 'Plus',
    limit: 150,
    priceMonthly: 14.9,
    description: 'Mais espaço para um armário em evolução.',
    benefits: ['Até 150 peças', 'Tudo do Essencial', '3x mais capacidade'],
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    limit: 500,
    priceMonthly: 29.9,
    description: 'Para acervos amplos e coleções completas.',
    benefits: ['Até 500 peças', 'Tudo do Plus', '10x mais capacidade'],
  },
]);

export const DEFAULT_WARDROBE_PLAN_ID = 'FREE';

export function getWardrobePlan(planId) {
  return WARDROBE_PLANS.find((plan) => plan.id === planId) || WARDROBE_PLANS[0];
}

export function getWardrobeCapacity(planId, used) {
  const plan = getWardrobePlan(planId);
  const normalizedUsed = Math.max(0, Number(used) || 0);
  const available = Math.max(0, plan.limit - normalizedUsed);

  return {
    plan,
    used: normalizedUsed,
    limit: plan.limit,
    available,
    isFull: available === 0,
    percentage: Math.min(100, Math.round((normalizedUsed / plan.limit) * 100)),
  };
}

export function formatPlanPrice(priceMonthly) {
  if (!priceMonthly) return 'Grátis';
  return `R$ ${priceMonthly.toFixed(2).replace('.', ',')} / mês`;
}
