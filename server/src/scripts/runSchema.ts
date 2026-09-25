import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool } from '../db/pool.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(__dirname, '..', 'db', 'schema.sql');

async function run() {
  const sql = readFileSync(schemaPath, 'utf8');
  console.log('[db] Ejecutando schema.sql ...');
  try {
    await pool.query(sql);
    console.log('[db] Schema creado correctamente.');
  } catch (err) {
    console.error('[db] Error al ejecutar el schema:', err instanceof Error ? err.message : err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void run();
