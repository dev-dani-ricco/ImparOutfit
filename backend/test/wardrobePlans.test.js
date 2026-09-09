import assert from 'node:assert/strict';
import test from 'node:test';
import {capacityFromPolicy} from '../src/services/wardrobePlanService.js';
test('POC unconfigured policy imposes no legacy quantity',()=>{
 assert.equal(capacityFromPolicy(1000,null).isFull,false);
 assert.equal(capacityFromPolicy(1000,null).available,null);
});
test('configured entitlement supports arbitrary capacity including zero',()=>{
 assert.equal(capacityFromPolicy(3,3).isFull,true);
 assert.equal(capacityFromPolicy(2,3).available,1);
 assert.equal(capacityFromPolicy(0,0).isFull,true);
});
