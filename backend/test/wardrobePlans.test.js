import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_WARDROBE_PLAN_ID,
  getWardrobePlan,
  listWardrobePlans,
} from '../src/config/wardrobePlans.js';
import { plansForClient } from '../src/services/wardrobePlanService.js';

test('plano gratuito é o padrão e comporta 50 peças', () => {
  const plan = getWardrobePlan('UNKNOWN');
  assert.equal(plan.id, DEFAULT_WARDROBE_PLAN_ID);
  assert.equal(plan.limit, 50);
});

test('capacidades aumentam em cada upgrade', () => {
  const plans = listWardrobePlans();
  assert.deepEqual(plans.map((plan) => plan.limit), [50, 150, 500]);
});

test('não permite selecionar plano abaixo do consumo atual', () => {
  const plans = plansForClient('PREMIUM', 151);
  assert.equal(plans.find((plan) => plan.id === 'FREE').selectable, false);
  assert.equal(plans.find((plan) => plan.id === 'PLUS').selectable, false);
  assert.equal(plans.find((plan) => plan.id === 'PREMIUM').selectable, true);
});
