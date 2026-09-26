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
