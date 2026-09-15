import policy from './policy.json' with {type:'json'};
export {policy};
export const categories=['TOP','PANTS','DRESS','FOOTWEAR','BAG','ACCESSORY'];
export const DEFAULT_RECONSTRUCTION_MAX_RETRIES=2;
export function reconstructionMaxRetries(){
 const value=Number.parseInt(process.env.RECONSTRUCTION_MAX_RETRIES??String(DEFAULT_RECONSTRUCTION_MAX_RETRIES),10);
 return Number.isSafeInteger(value)&&value>=0?value:DEFAULT_RECONSTRUCTION_MAX_RETRIES;
}
export function captureProtocol(category){
 const p=policy.captureProtocols?.[category];
 if(!p)throw new Error('CAPTURE_PROTOCOL_UNSUPPORTED');
 return p;
}
export const transitions={
 CAPTURED:['VALIDATING'],VALIDATING:['QUEUED','NEEDS_MORE_INPUT','FAILED'],
 QUEUED:['PROCESSING','FAILED'],PROCESSING:['QUALITY_CHECK','NEEDS_MORE_INPUT','FAILED'],
 QUALITY_CHECK:['READY','NEEDS_MORE_INPUT','FAILED'],
 NEEDS_MORE_INPUT:['VALIDATING'],FAILED:['VALIDATING','QUEUED'],READY:[]
};
export function canTransition(from,to){return transitions[from]?.includes(to)===true;}
export function validateCapture(inputs,p=policy){
 const reasons=[];
 if(inputs.length<p.minPhotos)reasons.push({code:'MORE_VIEWS',message:`Envie pelo menos ${p.minPhotos} fotos da mesma peça, mantendo sobreposição.`});
 if(new Set(inputs.map(i=>i.sha256)).size<inputs.length)reasons.push({code:'DUPLICATE_IMAGES',message:'Substitua fotos repetidas por novas vistas.'});
 if(new Set(inputs.map(i=>Math.floor(i.azimuth/45))).size<p.minAzimuthSectors)reasons.push({code:'COVER_AROUND',message:'Complete a volta da peça; inclua frente, costas e laterais.'});
 if(new Set(inputs.map(i=>i.elevation)).size<p.minElevationLevels)reasons.push({code:'CHANGE_ELEVATION',message:'Adicione uma volta de fotos em outra altura, mostrando superfícies ocultas.'});
 return reasons;
}
export function qualityGate(metrics,inspection,dimension,p=policy){
 const issues=[];
 if(!Number.isFinite(metrics.triangles)||metrics.triangles<p.minTriangles||metrics.triangles>p.maxTriangles)issues.push('GEOMETRY');
 if(!Number.isFinite(metrics.registeredRatio)||metrics.registeredRatio<p.minRegisteredRatio)issues.push('CAMERA_COVERAGE');
 if(!Number.isFinite(metrics.reprojectionError)||metrics.reprojectionError>p.maxReprojectionError)issues.push('REPROJECTION');
 if(metrics.invalidGeometry!==0)issues.push('INVALID_GEOMETRY');
 if(!inspection?.complete||!inspection?.isolatedItem)issues.push('COMPLETENESS_REVIEW');
 if(!inspection?.colorFaithful)issues.push('COLOR_REVIEW');
 if(!inspection?.categoryConfirmed)issues.push('CATEGORY_REVIEW');
 if(!dimension||!Number.isFinite(dimension.valueMeters)||dimension.valueMeters<=0||!Number.isFinite(dimension.confidence)||dimension.confidence<p.minScaleConfidence)issues.push('DIMENSION_REFERENCE');
 return {state:issues.length?'NEEDS_MORE_INPUT':'READY',issues,compositionReady:issues.length===0,
 policyVersion:p.version,scaleConfidence:dimension?.confidence??null,categoryConfidence:inspection?.categoryConfirmed?'USER_CONFIRMED':'UNKNOWN'};
}
