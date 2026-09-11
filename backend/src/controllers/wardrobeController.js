import {getWardrobeCapacity} from '../services/wardrobePlanService.js';
import {HttpError} from '../utils/http.js';
export async function capacity(req,res){res.json({...await getWardrobeCapacity(req.user.id),plans:[]});}
export async function requestUpgrade(_req,res,next){
 res.set('Deprecation','true');
 next(new HttpError(410,'Endpoint retired',{code:'STATE_CONFLICT'}));
}
