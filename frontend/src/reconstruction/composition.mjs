export function compositionItem(job){
 if(job?.state!=='READY'||job.quality?.compositionReady!==true||!job.output||!Number.isFinite(job.placement?.uniformScale)||job.placement.uniformScale<=0)throw new Error('Asset sem autorização de qualidade para composição');
 return {jobId:job.id,kind:job.product_id?'COMMERCIAL_PREVIEW':'OWNED_ITEM',resourceId:job.product_id||job.wardrobe_item_id,
  scale:[job.placement.uniformScale,job.placement.uniformScale,job.placement.uniformScale],category:job.category};
}
export function swapComparedItem(scene,job){
 return {...scene,item:compositionItem(job)}; // Camera, avatar and placement remain constant.
}
export const captureSteps=Array.from({length:36},(_,i)=>({azimuth:(i%12)*30,elevation:['MID','HIGH','LOW'][Math.floor(i/12)]}));
