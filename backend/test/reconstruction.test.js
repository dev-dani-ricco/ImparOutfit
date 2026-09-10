import test from 'node:test';import assert from 'node:assert/strict';
import {canTransition,validateCapture,qualityGate} from '../src/reconstruction/domain.js';
import {inspectGlb} from '../src/reconstruction/glb.js';
import {syntheticGlb} from '../fixtures/syntheticGlb.js';
test('job state machine never bypasses validation and quality',()=>{
 assert.equal(canTransition('CAPTURED','READY'),false);assert.equal(canTransition('PROCESSING','READY'),false);
 assert.equal(canTransition('READY','PROCESSING'),false);assert.equal(canTransition('QUALITY_CHECK','READY'),true);
});
test('duplicate and missing views return actionable recapture guidance',()=>{
 const bad=validateCapture([{sha256:'x',azimuth:0,elevation:'MID'},{sha256:'x',azimuth:90,elevation:'MID'}]);
 assert.ok(bad.some(x=>x.code==='DUPLICATE_IMAGES'));assert.ok(bad.some(x=>x.code==='MORE_VIEWS'));
 const valid=Array.from({length:12},(_,i)=>({sha256:String(i),azimuth:i*30,elevation:i<6?'LOW':'HIGH'}));
 assert.deepEqual(validateCapture(valid),[]);
});
test('geometry alone cannot pass quality; incomplete surfaces or absent scale fail',()=>{
 const m={triangles:1000,invalidGeometry:0,registeredRatio:.9,reprojectionError:1};
 const inspection={complete:true,isolatedItem:true,colorFaithful:true,categoryConfirmed:true};
 assert.equal(qualityGate(m,null,null).state,'NEEDS_MORE_INPUT');
 assert.equal(qualityGate(m,inspection,{valueMeters:.3,confidence:.5}).state,'READY');
 assert.equal(qualityGate({...m,registeredRatio:.2},inspection,{valueMeters:.3,confidence:.5}).state,'NEEDS_MORE_INPUT');
 assert.equal(qualityGate(m,{...inspection,complete:false},{valueMeters:.3,confidence:.5}).compositionReady,false);
});
test('private binary profile refuses masquerading images and malformed GLBs',()=>{
 const valid=inspectGlb(syntheticGlb());assert.equal(valid.triangles,450);assert.equal(valid.vertices,256);
 assert.throws(()=>inspectGlb(Buffer.from('fake mesh')));
 const b=Buffer.alloc(40);b.write('glTF');b.writeUInt32LE(2,4);b.writeUInt32LE(40,8);b.writeUInt32LE(999999,12);
 assert.throws(()=>inspectGlb(b));
});
