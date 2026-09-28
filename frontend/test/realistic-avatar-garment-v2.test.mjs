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

test('garment capture records fabric behavior for the 3D fit preview',()=>{
 const form=fs.readFileSync(new URL('../src/screens/ItemFormScreen.js',import.meta.url),'utf8');
 const detail=fs.readFileSync(new URL('../src/screens/WardrobeItemScreen.js',import.meta.url),'utf8');
 for(const fabric of ['RIGID','STRUCTURED','KNIT','FLUID']) assert.match(form,new RegExp(fabric));
 assert.match(form,/fabricClass=\{fabricClass\}/);
 assert.match(detail,/item\.fabricClass/);
});

test('professional avatar studio exposes advanced anatomical controls and focus zoom',()=>{
 const domain=fs.readFileSync(new URL('../src/avatar/avatarSpec.mjs',import.meta.url),'utf8');
 const studio=fs.readFileSync(new URL('../src/screens/AvatarStudioScreen.js',import.meta.url),'utf8');
 const renderer=fs.readFileSync(new URL('../src/components/ParametricAvatar3D.native.js',import.meta.url),'utf8');
 for(const control of ['armsLength','calves','glutes','chinProjection','noseBridge','eyesHeight']) assert.match(domain,new RegExp(control));
 for(const label of ['COMPRIMENTO DOS BRAÇOS','PANTURRILHAS','GLÚTEOS','PROJEÇÃO DO QUEIXO','PONTE DO NARIZ','ALTURA DOS OLHOS','COR DOS OLHOS']) assert.match(studio,new RegExp(label));
 assert.match(renderer,/CameraRig/);
 assert.match(renderer,/focus === 'ROSTO'/);
 assert.match(studio,/Avatar Realista/);
});

test('professional garment preview uses GLB templates and fabric-aware materials',()=>{
 const preview=fs.readFileSync(new URL('../src/components/Garment3DPreview.native.js',import.meta.url),'utf8');
 for(const asset of ['top.glb','pants.glb','skirt.glb','dress.glb','bag.glb','shoe.glb']) assert.match(preview,new RegExp(asset.replace('.', '\\.')));
 for(const fabric of ['RIGID','STRUCTURED','KNIT','FLUID']) assert.match(preview,new RegExp(fabric));
 assert.match(preview,/GLTFLoader/);
 assert.match(preview,/PROXY TAILORED 3D/);
});

test('wardrobe uses authenticated private GLB only for READY reconstruction jobs',()=>{
 const screen=fs.readFileSync(new URL('../src/screens/WardrobeItemScreen.js',import.meta.url),'utf8');
 const privateRenderer=fs.readFileSync(new URL('../src/components/PrivateGarment3D.native.js',import.meta.url),'utf8');
 assert.match(screen,/job\.wardrobe_item_id === item\.id && job\.state === 'READY'/);
 assert.match(screen,/PrivateGarment3D jobId=\{readyJob\.id\} token=\{token\}/);
 assert.match(privateRenderer,/Authorization: 'Bearer ' \+ token/);
 assert.match(privateRenderer,/\/reconstruction\/jobs\/.*\/output/);
 assert.match(privateRenderer,/GLB PRIVADO · QUALITY GATE APROVADO/);
});
