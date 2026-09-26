import assert from 'node:assert/strict';
import test from 'node:test';
import {realisticAvatarFromExport,avatarEngine,AVATAR_PROVIDERS} from '../src/avatar/avatarProvider.mjs';
import {garmentFitProfile} from '../src/reconstruction/garmentFitV2.mjs';

test('realistic avatar export becomes the preferred engine',()=>{
 const realistic=realisticAvatarFromExport({url:'https://example.com/a.glb',avatarId:'a1',bodyId:'b1'});
 assert.equal(realistic.provider,AVATAR_PROVIDERS.AVATURN);
 assert.equal(avatarEngine({realisticAvatar:realistic}),AVATAR_PROVIDERS.AVATURN);
 assert.equal(avatarEngine({}),AVATAR_PROVIDERS.PARAMETRIC);
});

test('garment fit v2 reacts to body measurements by category',()=>{
 const base={heightCm:168,measurements:{bust:94,waist:76,hips:104},body:{shoulders:.5}};
 const top=garmentFitProfile('TOP',base);
 const larger=garmentFitProfile('TOP',{...base,measurements:{...base.measurements,bust:110}});
 assert.equal(top.version,2);
 assert.ok(larger.scale[0]>top.scale[0]);
 assert.ok(larger.silhouetteAllowance>=top.silhouetteAllowance);
 const pants=garmentFitProfile('PANTS',{...base,measurements:{...base.measurements,hips:120}});
 assert.ok(pants.scale[0]>1);
});
