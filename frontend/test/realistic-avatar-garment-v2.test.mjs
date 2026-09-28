import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {realisticAvatarFromExport,avatarEngine,AVATAR_PROVIDERS} from '../src/avatar/avatarProvider.mjs';
import {garmentFitProfile} from '../src/reconstruction/garmentFitV2.mjs';

test('realistic avatar export becomes the preferred engine',()=>{
 const realistic=realisticAvatarFromExport({url:'https://example.com/a.glb',avatarId:'a1',bodyId:'b1'});
 assert.equal(realistic.provider,AVATAR_PROVIDERS.AVATURN);
 assert.equal(avatarEngine({realisticAvatar:realistic}),AVATAR_PROVIDERS.AVATURN);
 assert.equal(avatarEngine({}),AVATAR_PROVIDERS.PARAMETRIC);
 assert.throws(()=>realisticAvatarFromExport({url:'http://insecure.example/a.glb'}),/HTTPS/);
});

test('realistic studio requires explicit consent before mounting provider WebView',()=>{
 const source=fs.readFileSync(new URL('../src/screens/RealisticAvatarStudioScreen.js',import.meta.url),'utf8');
 assert.match(source,/const \[consented,setConsented\]=useState\(false\)/);
 assert.match(source,/!consented \? <View style=\{styles\.consent\}>/);
 assert.match(source,/ENTENDO E QUERO CONTINUAR/);
 assert.match(source,/Fotos faciais\/corporais/);
});

test('garment fit v3 reacts to body measurements and fabric class',()=>{
 const base={heightCm:168,measurements:{bust:94,waist:76,hips:104},body:{shoulders:.5}};
 const top=garmentFitProfile('TOP',base);
 const larger=garmentFitProfile('TOP',{...base,measurements:{...base.measurements,bust:110}});
 assert.equal(top.version,3);
 assert.ok(larger.scale[0]>top.scale[0]);
 assert.ok(larger.silhouetteAllowance>=top.silhouetteAllowance);
 const rigid=garmentFitProfile('TOP',base,{fabricClass:'RIGID'});
 const knit=garmentFitProfile('TOP',base,{fabricClass:'KNIT'});
 assert.equal(rigid.fabricClass,'RIGID');
 assert.equal(knit.fabricClass,'KNIT');
 assert.ok(rigid.silhouetteAllowance>knit.silhouetteAllowance);
 const pants=garmentFitProfile('PANTS',{...base,measurements:{...base.measurements,hips:120}},{fabricClass:'STRUCTURED'});
 assert.ok(pants.scale[0]>1);
});
