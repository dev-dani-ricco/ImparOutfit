// Showcase has no commercial entitlement authority. API resolves actual policies.
export const DEFAULT_WARDROBE_PLAN_ID='DEMO';
export const WARDROBE_PLANS=Object.freeze([{id:'DEMO',name:'Demonstração',limit:null,priceMonthly:null}]);
export const getWardrobePlan=()=>WARDROBE_PLANS[0];
export function getWardrobeCapacity(_planId,used){
 return {plan:getWardrobePlan(),used:Math.max(0,Number(used)||0),limit:null,available:null,isFull:false,percentage:0};
}
export const formatPlanPrice=()=> 'Sem oferta comercial ativa';
