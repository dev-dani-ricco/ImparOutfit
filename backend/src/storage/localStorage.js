import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

/** Private object storage port: put/get/delete/getSignedReadUrl. Keys never come from filenames. */
export class LocalStorage {
  constructor(root) { this.root = resolve(root); }
  path(key) {
    if (!/^[0-9a-f-]{36}\.webp$/.test(key)) throw new Error('Invalid storage key');
    const target = resolve(this.root, key);
    if (!target.startsWith(this.root + sep)) throw new Error('Invalid storage path');
    return target;
  }
  async put(key, buffer) {
    await mkdir(this.root, { recursive: true, mode: 0o700 });
    await writeFile(this.path(key), buffer, { flag: 'wx', mode: 0o600 });
  }
  async get(key) { return readFile(this.path(key)); }
  async delete(key) { await unlink(this.path(key)).catch(e => { if (e.code !== 'ENOENT') throw e; }); }
  async getSignedReadUrl() { return null; } // Authenticated delivery locally; short-lived provider URLs later.
}
