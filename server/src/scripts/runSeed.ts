import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool } from '../db/pool.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const seedPath = join(__dirname, '..', 'db', 'seed.sql');

async function run() {
  const sql = readFileSync(seedPath, 'utf8');
  console.log('[db] Ejecutando seed.sql ...');
  try {
    await pool.query(sql);
    console.log('[db] Datos de prueba insertados correctamente.');
  } catch (err) {
    console.error('[db] Error al ejecutar el seed:', err instanceof Error ? err.message : err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void run();
