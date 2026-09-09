export const STATE_VERSION = 2;
export const fixturePersonIds = new Set(['demo-person', 'demo-store-owner']);
export function personStorageKey(personId, mode='demo') {
  if (!personId || !['demo','api'].includes(mode)) throw new Error('Identity required');
  return '@imparoutfit/person-state-v2/'+mode+'/'+encodeURIComponent(personId);
}
export function readPersonState(raw, personId) {
  if (!raw) return null;
  try {
    const data=JSON.parse(raw);
    return data.version===STATE_VERSION && data.personId===personId ? data.state : null;
  } catch { return null; }
}
export function packPersonState(personId,state) {
  return JSON.stringify({version:STATE_VERSION,personId,state});
}
export function ownedItem(personId,item,now=Date.now()) {
  if (!personId || item.sourceItemId || item.sourceStoreId || !item.ownershipAttested || !['MANUAL_CATALOG','REAL_CAPTURE','DEMO_CATALOG'].includes(item.ownershipSource)) {
    throw new Error('Catalogação de posse necessária');
  }
  return {...item,id:'wardrobe-'+now,personId,kind:'OWNED_ITEM',ownershipEvent:{source:item.ownershipSource,personId,recordedAt:new Date(now).toISOString()}};
}
export function commercialReference(personId,storeId,item,kind='COMMERCIAL_PREVIEW') {
  if(!personId || !['COMMERCIAL_PREVIEW','SPONSORED_PREVIEW'].includes(kind))throw new Error('Preview inválido');
  return {...item,id:'saved-'+item.id,personId,productId:item.id,sourceStoreId:storeId,kind};
}
export function collectionReferences(personId,ids,wardrobe,saves) {
  const resources=[...wardrobe,...Object.values(saves)];
  return ids.map(id=>{
    const item=resources.find(r=>r.id===id && r.personId===personId);
    if(!item)throw new Error('Recurso não autorizado');
    return item.kind==='OWNED_ITEM' ? {kind:item.kind,wardrobeItemId:item.id} : {kind:item.kind,productId:item.productId};
  });
}

export function seedPersonalDemo(personId,items,stores,collections) {
  if(personId!=='demo-person')return {wardrobe:[],saves:{},collections:[]};
  const copies={'wardrobe-bomber':'aurora-1','wardrobe-bag':'lume-2','wardrobe-sneakers':'impar-1'};
  const saves={};
  for(const store of stores)for(const item of store.items) {
    const legacyId=Object.keys(copies).find(id=>copies[id]===item.id);
    if(legacyId)saves[item.id]={...commercialReference(personId,store.id,item),legacyWardrobeId:legacyId};
  }
  const wardrobe=items.filter(item=>!copies[item.id]).map((item,index)=>({...ownedItem(personId,{...item,ownershipAttested:true,ownershipSource:'DEMO_CATALOG'},index+1),id:item.id}));
  return {wardrobe,saves,collections:collections.map(item=>{
    const itemIds=item.itemIds.map(id=>copies[id]?'saved-'+copies[id]:id);
    return {...item,itemIds,personId,version:1,references:collectionReferences(personId,itemIds,wardrobe,saves)};
  })};
}
