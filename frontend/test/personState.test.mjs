import test from 'node:test';
import assert from 'node:assert/strict';
import {personStorageKey,readPersonState,packPersonState,ownedItem,commercialReference,collectionReferences,seedPersonalDemo} from '../src/domain/personState.mjs';

test('sessions isolate wardrobe, profile/avatar, collections and saves; old global state is not attributed',()=>{
  const storage=new Map();
  const state={wardrobe:[{id:'private'}],profile:{waist:72,profilePhoto:{uri:'private'}},personalCollections:[{id:'look'}],commercialSaves:{x:{id:'saved'}}};
  storage.set(personStorageKey('A'),packPersonState('A',state));
  assert.equal(storage.get(personStorageKey('B')),undefined);
  assert.deepEqual(readPersonState(storage.get(personStorageKey('A')),'A'),state);
  assert.equal(readPersonState(storage.get(personStorageKey('A')),'B'),null);
  assert.equal(readPersonState(JSON.stringify(state),'A'),null);
  assert.notEqual(personStorageKey('A','demo'),personStorageKey('A','api'));
  assert.deepEqual(readPersonState(packPersonState('A',{wardrobe:[]}),'A').wardrobe,[]);
});

test('known commercial copies in demo fixtures become references without inflating wardrobe',()=>{
  const items=[{id:'wardrobe-bomber'},{id:'real-shirt'}];
  const stores=[{id:'store-a',items:[{id:'aurora-1'}]}];
  const collections=[{id:'look',itemIds:['wardrobe-bomber','real-shirt']}];
  const migrated=seedPersonalDemo('demo-person',items,stores,collections);
  assert.deepEqual(migrated.wardrobe.map(i=>i.id),['real-shirt']);
  assert.equal(migrated.saves['aurora-1'].kind,'COMMERCIAL_PREVIEW');
  assert.deepEqual(migrated.collections[0].references.map(i=>i.kind),['COMMERCIAL_PREVIEW','OWNED_ITEM']);
  assert.deepEqual(seedPersonalDemo('new-person',items,stores,collections),{wardrobe:[],saves:{},collections:[]});
});
test('saving/previewing leaves ownership and capacity unchanged; mixed references retain kinds',()=>{
  const wardrobe=[ownedItem('A',{name:'Real item',ownershipSource:'MANUAL_CATALOG',ownershipAttested:true},1)];
  const save=commercialReference('A','store-A',{id:'product-1',name:'Commercial'});
  const sponsored=commercialReference('A','store-A',{id:'product-2'},'SPONSORED_PREVIEW');
  const refs=collectionReferences('A',[wardrobe[0].id,save.id,sponsored.id],wardrobe,{p:save,q:sponsored});
  assert.deepEqual(refs.map(r=>r.kind),['OWNED_ITEM','COMMERCIAL_PREVIEW','SPONSORED_PREVIEW']);
  assert.equal(wardrobe.length,1);
  assert.equal(save.ownershipEvent,undefined);
  assert.throws(()=>ownedItem('A',{...save,ownershipSource:'MANUAL_CATALOG',ownershipAttested:true}));
  assert.throws(()=>collectionReferences('B',[wardrobe[0].id],wardrobe,{}));
});
