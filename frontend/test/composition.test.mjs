import test from 'node:test';import assert from 'node:assert/strict';
import {compositionItem,swapComparedItem,captureSteps} from '../src/reconstruction/composition.mjs';
const job={id:'a',state:'READY',quality:{compositionReady:true},output:{id:'mesh-a'},placement:{uniformScale:.4},wardrobe_item_id:'owned',category:'TOP'};
test('composition refuses previews without passed quality; preserves proportions',()=>{
 assert.throws(()=>compositionItem({...job,state:'QUALITY_CHECK'}));
 assert.deepEqual(compositionItem(job).scale,[.4,.4,.4]);
});
test('comparison changes one asset, preserving camera, avatar and ownership semantics',()=>{
 const scene={camera:{yaw:2},avatar:{id:'reference'},position:[0,1,0],item:compositionItem(job)};
 const product={...job,id:'b',wardrobe_item_id:null,product_id:'commercial',placement:{uniformScale:.3}};
 const compared=swapComparedItem(scene,product);
 assert.equal(compared.camera,scene.camera);assert.equal(compared.avatar,scene.avatar);assert.equal(compared.position,scene.position);
 assert.equal(compared.item.kind,'COMMERCIAL_PREVIEW');assert.equal(scene.item.kind,'OWNED_ITEM');
 assert.equal(product.wardrobe_item_id,null);
 assert.equal(captureSteps.length,36);
});
