import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { avatarMorphWeights, garmentFitScale, normalizeAvatarSpec } from '../src/avatar/avatarSpec.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

function readGlbJson(relative) {
  const bytes = fs.readFileSync(path.join(root, relative));
  assert.equal(bytes.readUInt32LE(0), 0x46546c67, `${relative} must be GLB`);
  assert.equal(bytes.readUInt32LE(4), 2, `${relative} must be glTF 2`);
  const jsonLength = bytes.readUInt32LE(12);
  const jsonType = bytes.readUInt32LE(16);
  assert.equal(jsonType, 0x4e4f534a);
  return JSON.parse(bytes.subarray(20, 20 + jsonLength).toString('utf8').trim());
}

test('parametric base contains professional face/body morph targets and a skin', () => {
  const gltf = readGlbJson('assets/models/parametric/makehuman-parametric-base.glb');
  assert.ok((gltf.skins || []).length >= 1);
  const body = gltf.meshes.find((mesh) => mesh.name === 'Body');
  assert.ok(body, 'Body mesh missing');
  const names = body.extras?.targetNames || [];
  assert.ok(names.length >= 300, `expected >=300 body morphs, got ${names.length}`);
  for (const expected of [
    'headOval','headRound','headSquare','jawWider','jawNarrower',
    'noseWider','noseNarrower','eyeBiggerLeft','mouthWider',
    'bodyFeminine','bodyMasculine','bodyHeavier','bodyThinner',
    'shouldersWider','bustBigger','waistNarrower','hipsWider','heightTaller'
  ]) assert.ok(names.includes(expected), `missing morph ${expected}`);
});

test('bundled hair assets are self-contained GLB files', () => {
  for (const name of ['Hair_Buzzed','Hair_SimpleParted','Hair_Long','Hair_Buns']) {
    const gltf = readGlbJson(`assets/models/hair/${name}.glb`);
    assert.ok((gltf.meshes || []).length >= 1, `${name} mesh missing`);
    assert.ok((gltf.buffers || []).every((buffer) => !buffer.uri), `${name} must not require external BIN`);
  }
});

test('avatar controls map to bounded real morph target names', () => {
  const spec = normalizeAvatarSpec({
    height: '178', bust: '106', waist: '69', hips: '112',
    avatarControls: {
      body: { presentation: 'feminine', weight: 0.8, shoulders: 0.78, hips: 0.82 },
      face: { shape: 'diamond', width: 0.75, noseWidth: 0.2, eyesSize: 0.8, lipFullness: 0.75 },
    },
  });
  const morphs = avatarMorphWeights(spec);
  for (const key of ['bodyFeminine','bodyHeavier','shouldersWider','hipsWider','headDiamond','headWider','noseNarrower','eyeBiggerLeft','mouthUpperLipFuller']) {
    assert.ok(key in morphs, `expected mapping ${key}`);
    assert.ok(morphs[key] >= 0 && morphs[key] <= 1, `${key} out of bounds`);
  }
});

test('garment proportional fit reacts by category while staying bounded', () => {
  const base = normalizeAvatarSpec({ height: '168', bust: '94', waist: '76', hips: '104' });
  const curvy = normalizeAvatarSpec({ height: '178', bust: '112', waist: '82', hips: '124' });
  const baseDress = garmentFitScale('DRESS', base);
  const curvyDress = garmentFitScale('DRESS', curvy);
  assert.ok(curvyDress[0] > baseDress[0]);
  assert.ok(curvyDress[1] > baseDress[1]);
  for (const scale of [...baseDress, ...curvyDress]) assert.ok(scale >= 0.82 && scale <= 1.24);
});

test('mobile implementation exposes studio and proportional garment fit', () => {
  const avatar = read('src/components/ParametricAvatar3D.native.js');
  const studio = read('src/screens/AvatarStudioScreen.js');
  const composition = read('src/reconstruction/CompositionView.js');
  assert.match(avatar, /makehuman-parametric-base\.glb/);
  assert.match(avatar, /Hair_Buzzed\.glb/);
  assert.match(avatar, /arrayBuffer\(\)/);
  assert.match(avatar, /morphTargetInfluences/);
  for (const tab of ['CORPO','ROSTO','CABELO']) assert.match(studio, new RegExp(tab));
  assert.match(composition, /garmentFitScale/);
  assert.match(composition, /Aplicar ajuste corporal/);
  assert.match(composition, /makehuman-parametric-base\.glb/);
});
