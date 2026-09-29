import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('presentation exposes distinct client and merchant journeys', () => {
  const login = read('src/screens/LoginScreen.js');
  const nav = read('src/navigation/RootNavigator.js');
  const home = read('src/screens/HomeScreen.js');
  const merchant = read('src/screens/StoreAccountScreen.js');

  assert.match(login, /CLIENTE FINAL/);
  assert.match(login, /LOJISTA/);
  for (const tab of ['Início', 'Armário', 'Descobrir', 'Análise', 'Perfil']) {
    assert.match(nav, new RegExp(tab));
  }
  for (const tab of ['Painel', 'Catálogo', 'Campanhas', 'Conta']) {
    assert.match(nav, new RegExp(tab));
  }
  assert.match(home, /CLIENTE FINAL/);
  assert.match(merchant, /CONTEXTO ATIVO · LOJISTA/);
});

test('demo preview requires explicit journey selection by default', () => {
  const auth = read('src/contexts/AuthContext.js');
  const config = read('app.config.js');
  assert.match(auth, /configuredDemoAutoResume/);
  assert.match(config, /EXPO_PUBLIC_DEMO_AUTO_RESUME/);
});

test('connected mode uses the real product shell without DemoContext as its data source', () => {
  const app = read('App.js');
  const nav = read('src/navigation/RootNavigator.js');
  const connected = read('src/screens/ConnectedProductScreens.js');
  const data = read('src/contexts/ConnectedDataContext.js');

  assert.match(app, /ConnectedDataProvider/);
  assert.match(nav, /ConnectedPersonExperience/);
  assert.match(nav, /ConnectedBrandExperience/);
  assert.doesNotMatch(nav, /function ConnectedExperience\(/);
  assert.doesNotMatch(connected, /DemoContext/);

  for (const endpoint of ['/profile', '/wardrobe/items', '/commercial-saves', '/looks', '/stores', '/products']) {
    assert.match(data, new RegExp(endpoint.replaceAll('/', '\\/')));
  }
});

test('native avatar loader reads the GLB as binary before parsing', () => {
  const avatar = read('src/components/BodyAvatar3D.native.js');
  assert.match(avatar, /new File\(modelUri\)/);
  assert.match(avatar, /arrayBuffer\(\)/);
  assert.match(avatar, /loader\.parse\(/);
  assert.doesNotMatch(avatar, /useLoader\(GLTFLoader/);
});

test('commercial UX dependencies stay Expo-Go compatible', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.ok(pkg.dependencies['expo-image']);
  assert.ok(pkg.dependencies['expo-haptics']);
});


test('professional avatar v2 exposes body, face, skin and hair controls', () => {
  const avatar = read('src/components/BodyAvatar3D.native.js');
  const profile = read('src/screens/ProfileScreen.js');
  const domain = read('src/avatar/avatarProfile.js');

  for (const token of ['Shoulders', 'Torso', 'Thighs', 'HeadWidth', 'Jaw', 'Chin', 'FaceDepth']) {
    assert.match(avatar, new RegExp(token));
  }
  for (const token of ['BODY_PRESETS', 'FACE_SHAPES', 'SKIN_TONES', 'HAIR_STYLES', 'HAIR_COLORS']) {
    assert.match(profile, new RegExp(token));
    assert.match(domain, new RegExp(token));
  }
  assert.match(avatar, /AVATAR PARAMÉTRICO V2/);
  assert.match(domain, /PARAMETRIC_LOCAL_V2/);
});

test('garment preview distinguishes proxy geometry from reconstructed GLB', () => {
  const garment = read('src/components/Garment3DPreview.native.js');
  const form = read('src/screens/ItemFormScreen.js');
  const item = read('src/screens/WardrobeItemScreen.js');

  assert.match(garment, /PROXY TAILORED 3D/);
  for (const asset of ['top.glb', 'pants.glb', 'skirt.glb', 'dress.glb', 'bag.glb', 'shoe.glb']) assert.match(garment, new RegExp(asset.replace('.', '\\.')));
  assert.match(garment, /FABRIC_MATERIALS/);
  assert.match(garment, /GLB VALIDADO/);
  assert.match(form, /quality gate/);
  assert.match(item, /Garment3DPreview/);
});

test('3D asset provenance blocks unknown human mesh from production', () => {
  const provenance = JSON.parse(read('../docs/3d/asset-provenance.json'));
  const michelle = provenance.assets.find((asset) => asset.path?.endsWith('michelle.glb'));
  assert.equal(michelle?.productionAllowed, false);
  assert.equal(michelle?.status, 'DEV_ONLY_UNVERIFIED');
  assert.equal(provenance.assets.find((asset) => asset.family === 'MAKEHUMAN_CORE')?.license, 'CC0');
});
