import {getWardrobeCapacity} from '../services/wardrobePlanService.js';
export async function capacity(req,res){res.json({...await getWardrobeCapacity(req.user.id),plans:[]});}
export async function requestUpgrade(_req,res){
 res.set('Deprecation','true').status(410).json({code:'ENTITLEMENT_MIGRATION',error:'Upgrade legado descontinuado; cobrança não implementada'});
}
