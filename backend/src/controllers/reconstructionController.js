import Joi from 'joi';
import {randomUUID,createHash} from 'node:crypto';
import {query} from '../config/db.js';
import {validate,uuid} from '../utils/validation.js';
import {HttpError} from '../utils/http.js';
import {authorizePersonal,authorizeCapability} from '../services/authorizationService.js';
import {withMedia,storage} from '../services/imageService.js';
import {authorizedJob,transition,transaction,jobDto} from '../reconstruction/service.js';
import {policy,validateCapture,qualityGate,categories,captureProtocol} from '../reconstruction/domain.js';
export async function protocol(_req,res){
 res.json({version:policy.version,categories,protocols:policy.captureProtocols,minPhotos:policy.minPhotos,maxPhotos:policy.maxPhotos,
 guidance:['Mantenha a peça imóvel em suporte; mova a câmera ao redor.','Use fundo contrastante e iluminação difusa constante, sem flash/reflexos.','Mantenha a peça inteira e nítida, ocupando a maior parte do quadro.','Faça 3 voltas de 12 fotos (30 graus), nas alturas baixa, média e alta, com sobreposição.','Inclua frente, costas, laterais e partes ocultas; não altere zoom/exposição entre fotos.','Meça uma dimensão real; a escala não será inferida como precisa.'],
 source:'MULTIVIEW_PHOTOS',videoSupported:false});
}
export async function create(req,res){
 const b=validate(Joi.object({itemId:uuid,productId:uuid,category:Joi.string().valid(...categories).required(),
 captureMetadata:Joi.object({background:Joi.string().max(200),lighting:Joi.string().max(200),support:Joi.string().max(200)}).default({})}).xor('itemId','productId'),req.body);
 const result=await transaction(async c=>{
  let org=null;
  if(b.itemId)authorizePersonal(req.auth,(await c.query('SELECT person_id FROM wardrobe_items WHERE id=$1',[b.itemId])).rows[0]);
  else {
   const p=(await c.query('SELECT p.id,s.organization_id FROM products p JOIN stores s ON s.id=p.store_id WHERE p.id=$1',[b.productId])).rows[0];
   if(!p)throw new HttpError(404,'Produto indisponível');
   org=p.organization_id;await authorizeCapability(req.auth,org,'catalog.write',p.id,c);
  }
  await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[req.auth.personId]);
  const n=(await c.query("SELECT count(*)::int n FROM reconstruction_jobs WHERE person_id=$1 AND state IN ('CAPTURED','QUEUED','PROCESSING','VALIDATING','QUALITY_CHECK')",[req.auth.personId])).rows[0].n;
  if(n>=5)throw new HttpError(429,'Conclua um dos jobs pendentes antes de iniciar outro');
  const protocol=captureProtocol(b.category);
  const expectedShots=Array.from({length:protocol.expectedShots},(_,i)=>({azimuth:(i%12)*protocol.azimuthStep,elevation:protocol.elevations[Math.floor(i/12)]}));
  const session=(await c.query(`INSERT INTO capture_sessions(person_id,wardrobe_item_id,product_id,category,protocol_version,expected_shots)
   VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,[req.auth.personId,b.itemId||null,b.productId||null,b.category,protocol.version,expectedShots])).rows[0];
  const j=(await c.query(`INSERT INTO reconstruction_jobs(person_id,requested_by_principal_id,wardrobe_item_id,product_id,organization_id,category,pipeline_version,technique,capture_metadata,capture_session_id)
   VALUES($1,$2,$3,$4,$5,$6,$7,'COLMAP_CPU_SGBM',$8,$9) RETURNING *`,[req.auth.personId,req.auth.principalId,b.itemId||null,b.productId||null,org,b.category,policy.version,{...b.captureMetadata,captureSessionId:session.id,protocolVersion:protocol.version},session.id])).rows[0];
  await c.query("INSERT INTO reconstruction_attempts(job_id,sequence,input_revision,pipeline_version,state) VALUES($1,1,0,$2,'CAPTURED')",[j.id,policy.version]);
  await c.query("INSERT INTO reconstruction_events(job_id,actor_person_id,to_state) VALUES($1,$2,'CAPTURED')",[j.id,req.auth.personId]);
  return j;
 });res.status(201).json(jobDto(result));
}
export async function list(req,res){res.set('Cache-Control','private, no-store').json((await query('SELECT id,wardrobe_item_id,product_id,category,state,created_at FROM reconstruction_jobs WHERE person_id=$1 ORDER BY created_at DESC LIMIT 100',[req.auth.personId])).rows);}
export async function captureSession(req,res){
 const session=(await query('SELECT * FROM capture_sessions WHERE id=$1',[req.params.id])).rows[0];
 authorizePersonal(req.auth,session);
 res.set('Cache-Control','private, no-store').json(session);
}
export async function get(req,res){
 const j=await authorizedJob(req.auth,req.params.id);
 const inputs=(await query('SELECT i.media_id,i.azimuth,i.elevation FROM reconstruction_inputs i WHERE job_id=$1',[j.id])).rows;
 const events=(await query('SELECT from_state,to_state,code,created_at FROM reconstruction_events WHERE job_id=$1 ORDER BY id',[j.id])).rows;
 const output=(await query('SELECT id,metadata FROM reconstruction_outputs WHERE job_id=$1 ORDER BY created_at DESC LIMIT 1',[j.id])).rows[0];
 const session=j.capture_session_id?(await query('SELECT id,protocol_version,expected_shots,received_shots,validation_status,validation FROM capture_sessions WHERE id=$1',[j.capture_session_id])).rows[0]:null;
 res.set('Cache-Control','private, no-store').json({...jobDto(j),inputs,events,captureSession:session,output:output?{...output,url:'/api/reconstruction/jobs/'+j.id+'/output'}:null});
}
export async function inputs(req,res){
 const b=validate(Joi.object({azimuth:Joi.number().integer().min(0).max(359).required(),elevation:Joi.string().valid('LOW','MID','HIGH').required()}),req.body);
 const job=await authorizedJob(req.auth,req.params.id);
 if(!req.files?.length)throw new HttpError(400,'Envie fotos');
 const out=await withMedia(req.files,req.auth,job.product_id?'CATALOG':'WARDROBE',job.organization_id,async(c,ids)=>{
  const j=await authorizedJob(req.auth,job.id,c,true);
  if(!['CAPTURED','NEEDS_MORE_INPUT','FAILED'].includes(j.state))throw new HttpError(409,'Captura fechada durante processamento');
  const count=(await c.query('SELECT count(*)::int n FROM reconstruction_inputs WHERE job_id=$1',[j.id])).rows[0].n;
  if(count+ids.length>policy.maxPhotos)throw new HttpError(413,'Limite de fotos por experimento atingido');
  for(const id of ids)await c.query('INSERT INTO reconstruction_inputs(job_id,person_id,media_id,azimuth,elevation) VALUES($1,$2,$3,$4,$5)',[j.id,req.auth.personId,id,b.azimuth,b.elevation]);
  await c.query('UPDATE reconstruction_jobs SET input_revision=input_revision+1 WHERE id=$1',[j.id]);
  if(j.capture_session_id)await c.query(`UPDATE capture_sessions SET received_shots=(SELECT COALESCE(jsonb_agg(jsonb_build_object('mediaId',i.media_id,'azimuth',i.azimuth,'elevation',i.elevation) ORDER BY i.created_at),'[]') FROM reconstruction_inputs i WHERE i.job_id=$1) WHERE id=$2`,[j.id,j.capture_session_id]);
  return {count:count+ids.length};
 });res.status(201).json(out);
}
export async function removeInput(req,res){
 await transaction(async c=>{
  const j=await authorizedJob(req.auth,req.params.id,c,true);
  if(!['CAPTURED','NEEDS_MORE_INPUT','FAILED'].includes(j.state))throw new HttpError(409,'Captura fechada');
  const r=await c.query('DELETE FROM reconstruction_inputs WHERE job_id=$1 AND media_id=$2 RETURNING media_id',[j.id,req.params.mediaId]);
  if(!r.rows.length)throw new HttpError(404,'Captura não encontrada');
  await c.query('UPDATE reconstruction_jobs SET input_revision=input_revision+1 WHERE id=$1',[j.id]);
  if(j.capture_session_id)await c.query(`UPDATE capture_sessions SET received_shots=(SELECT COALESCE(jsonb_agg(jsonb_build_object('mediaId',i.media_id,'azimuth',i.azimuth,'elevation',i.elevation) ORDER BY i.created_at),'[]') FROM reconstruction_inputs i WHERE i.job_id=$1) WHERE id=$2`,[j.id,j.capture_session_id]);
 });res.status(204).end();
}
export async function submit(req,res){
 const j=await transaction(async c=>{
  let j=await authorizedJob(req.auth,req.params.id,c,true);
  j=await transition(c,j,'VALIDATING',{actor:req.auth.personId});
  const data=(await c.query('SELECT i.azimuth,i.elevation,m.sha256 FROM reconstruction_inputs i JOIN media_assets m ON m.id=i.media_id WHERE job_id=$1',[j.id])).rows;
  const guidance=validateCapture(data);
  if(j.capture_session_id){
   const session=(await c.query('SELECT expected_shots FROM capture_sessions WHERE id=$1 FOR UPDATE',[j.capture_session_id])).rows[0];
   const seen=new Set(data.map(v=>v.azimuth+':'+v.elevation));
   const missing=guidance.length?session.expected_shots.filter(v=>!seen.has(v.azimuth+':'+v.elevation)):[];
   if(missing.length)guidance.push({code:'MISSING_POSITIONS',message:'Capture somente as posições indicadas.',positions:missing});
   await c.query('UPDATE capture_sessions SET validation_status=$2,validation=$3 WHERE id=$1',[j.capture_session_id,guidance.length?'NEEDS_MORE_INPUT':'READY_FOR_RECONSTRUCTION',{guidance,missingPositions:missing}]);
  }
  return transition(c,j,guidance.length?'NEEDS_MORE_INPUT':'QUEUED',{actor:req.auth.personId,code:guidance.length?'CAPTURE_INCOMPLETE':null,guidance});
 });res.status(202).json(jobDto(j));
}
export async function output(req,res){
 const j=await authorizedJob(req.auth,req.params.id);
 const asset=(await query('SELECT * FROM reconstruction_outputs WHERE job_id=$1 ORDER BY created_at DESC LIMIT 1',[j.id])).rows[0];
 if(!asset)throw new HttpError(404,'Reconstrução sem asset');
 const buffer=await storage.get(asset.storage_key);
 if(createHash('sha256').update(buffer).digest('hex')!==asset.sha256)throw new HttpError(409,'Integridade do asset inválida');
 res.set({'Content-Type':'model/gltf-binary','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Disposition':'inline; filename="reconstruction.glb"'}).send(buffer);
}
export async function inspect(req,res){
 const b=validate(Joi.object({
  inspection:Joi.object({complete:Joi.boolean().required(),isolatedItem:Joi.boolean().required(),colorFaithful:Joi.boolean().required(),categoryConfirmed:Joi.boolean().required(),manualCorrection:Joi.boolean().default(false)}).required(),
  dimension:Joi.object({axis:Joi.string().valid('x','y','z').required(),valueMeters:Joi.number().min(.001).max(5).required(),source:Joi.string().valid('USER_DECLARED','MERCHANT_DECLARED').required()}).required(),
 }).required(),req.body);
 const result=await transaction(async c=>{
  const j=await authorizedJob(req.auth,req.params.id,c,true);
  if(j.state!=='QUALITY_CHECK')throw new HttpError(409,'Job não está em inspeção');
  if(b.dimension.source==='MERCHANT_DECLARED'&&!j.product_id)throw new HttpError(400,'Fonte dimensional incompatível');
  const asset=(await c.query('SELECT metadata FROM reconstruction_outputs WHERE job_id=$1 ORDER BY created_at DESC LIMIT 1',[j.id])).rows[0];
  if(!asset)throw new HttpError(409,'Asset indisponível');
  const dimension={...b.dimension,confidence:.5,confidenceMeaning:'DECLARATION_NOT_METROLOGY',recordedBy:req.auth.personId,recordedAt:new Date().toISOString()};
  const gate=qualityGate(j.metrics,b.inspection,dimension);
  const k={x:0,y:1,z:2}[dimension.axis],bounds=asset.metadata.bounds;
  const scale=dimension.valueMeters/(bounds.max[k]-bounds.min[k]);
  const placement={uniformScale:scale,dimensionAxis:dimension.axis,fitTecnico:'VISUAL_PROPORTIONAL_ONLY',physics3d:'NOT_IMPLEMENTED',imparAnalysis:'NOT_EVALUATED',clientPreference:'USER_PLACEMENT'};
  const metrics={...j.metrics,first_pass_success:gate.compositionReady&&j.attempt===1&&j.recapture_count===0&&!b.inspection.manualCorrection,manual_correction:b.inspection.manualCorrection,recapture_required:!gate.compositionReady};
  await c.query('UPDATE reconstruction_jobs SET quality=$2,dimension_reference=$3,placement=$4 WHERE id=$1',[j.id,{...gate,inspection:b.inspection,reviewerPersonId:req.auth.personId},dimension,placement]);
  return transition(c,j,gate.state,{actor:req.auth.personId,metrics,code:gate.compositionReady?null:'QUALITY_REVIEW_FAILED',guidance:gate.issues});
 });res.json(jobDto(result));
}
