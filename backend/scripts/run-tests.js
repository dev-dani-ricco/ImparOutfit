import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const testDir = join(process.cwd(), 'test');
const files = readdirSync(testDir)
  .filter((name) => name.endsWith('.test.js'))
  .sort();

const testEnv = {
  ...process.env,
  NODE_ENV: 'test',
  // Keep tests isolated from the persistent local PGlite runtime. Node 24 +
  // nodefs-backed PGlite can abort during teardown even after assertions pass.
  PGLITE_DATA_DIR: 'memory://',
};

for (const name of files) {
  const file = join('test', name);
  console.log('\n=== ' + file + ' ===');
  const result = spawnSync(process.execPath, ['--test', file], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: testEnv,
  });
  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log('\nALL_TEST_FILES=PASS');
