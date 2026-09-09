import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { pool } from '../config/db.js';

export const migrationDirectory = new URL('../../sql/', import.meta.url);
const readSql = async url => (await readFile(url,'utf8')).replace(/\r\n/g,'\n');
export async function migrate(client, { directory = migrationDirectory, adoptLegacy = false, down = false } = {}) {
  const files = (await readdir(directory)).filter(f => /^\d{3}_[a-z_]+\.sql$/.test(f)).sort();
  const execute = sql => client.exec ? client.exec(sql) : client.query(sql);
  await execute('BEGIN');
  try {
    await client.query("SELECT pg_advisory_xact_lock(734021)");
    await execute(`CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT now(), adopted BOOLEAN NOT NULL DEFAULT false
    )`);
    let applied = (await client.query('SELECT * FROM schema_migrations ORDER BY version')).rows;
    if (!applied.length && (await client.query("SELECT to_regclass('users') AS existing")).rows[0].existing) {
      if (!adoptLegacy) throw new Error('Legacy schema detected: run migrate:adopt after backup and schema review');
      // Do not silently stamp a partial manually installed schema.
      const check = (await client.query(`SELECT
        to_regclass('items') IS NOT NULL AND to_regclass('stores') IS NOT NULL AND
        to_regclass('looks') IS NOT NULL AND to_regclass('showcases') IS NOT NULL AND
        to_regclass('item_saves') IS NOT NULL AND to_regclass('follows') IS NOT NULL AND
        to_regclass('showcase_comments') IS NOT NULL AND to_regclass('customer_profiles') IS NOT NULL AND
        to_regclass('wardrobe_upgrade_requests') IS NOT NULL AND
        EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='users' AND column_name='wardrobe_plan') AND
        EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='items'::regclass AND tgname='trg_enforce_wardrobe_capacity') AND
        EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='users'::regclass AND conname='users_wardrobe_plan_check') AS valid`)).rows[0];
      if (!check.valid) throw new Error('Incomplete legacy schema; restore/apply missing legacy migrations in a reviewed maintenance operation');
      for (const name of files.filter(f => f < '004')) {
        const checksum = createHash('sha256').update(await readSql(new URL(name, directory))).digest('hex');
        await client.query('INSERT INTO schema_migrations(version,checksum,adopted) VALUES($1,$2,true)', [name, checksum]);
      }
      applied = (await client.query('SELECT * FROM schema_migrations ORDER BY version')).rows;
    }
    for (const row of applied) {
      if (!files.includes(row.version)) throw new Error('Applied migration missing: ' + row.version);
      const checksum = createHash('sha256').update(await readSql(new URL(row.version, directory))).digest('hex');
      if (checksum !== row.checksum) throw new Error('Migration checksum mismatch: ' + row.version);
    }
    if (down) {
      const last = applied.at(-1);
      if (!last) throw new Error('No migration to roll back');
      const rollback = new URL(last.version.replace('.sql', '.down.sql'), directory);
      let sql;
      try { sql = await readFile(rollback, 'utf8'); } catch { throw new Error('No safe down migration; restore reviewed backup or roll forward'); }
      await execute(sql);
      await client.query('DELETE FROM schema_migrations WHERE version=$1', [last.version]);
    } else {
      for (const name of files) {
        if (applied.some(m => m.version === name)) continue;
        if (applied.some(m => m.version > name)) throw new Error('Out-of-order migration: ' + name);
        const sql = await readSql(new URL(name, directory));
        await execute(sql);
        await client.query('INSERT INTO schema_migrations(version,checksum) VALUES($1,$2)', [name, createHash('sha256').update(sql).digest('hex')]);
      }
    }
    await execute('COMMIT');
    return (await client.query('SELECT version,adopted FROM schema_migrations ORDER BY version')).rows;
  } catch (error) { await execute('ROLLBACK'); throw error; }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const client = await pool.connect();
  try { console.log(await migrate(client, { adoptLegacy: process.argv.includes('--adopt-legacy'), down: process.argv.includes('--down') })); }
  catch (error) { console.error('Migration failed:', error.message); process.exitCode = 1; }
  finally { client.release(); await pool.end(); }
}
