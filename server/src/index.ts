import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';
import { pool } from './db/pool.js';

const app = express();

// CORS
const origins = config.CORS_ORIGIN === '*' ? '*' : config.CORS_ORIGIN.split(',').map((s) => s.trim());
app.use(cors({ origin: origins }));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// API routes
app.use('/api', routes);

// Error handler (must be last)
app.use(errorHandler);

async function start() {
  // Verify DB connection
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('[db] PostgreSQL conectado correctamente.');
  } catch (err) {
    console.error('[db] No se pudo conectar a PostgreSQL:', err instanceof Error ? err.message : err);
    console.error('[db] El servidor se iniciará de todas formas, pero las peticiones a la API fallarán.');
  }

  app.listen(config.PORT, () => {
    console.log(`[server] AgendaPro API escuchando en http://localhost:${config.PORT}`);
  });
}

void start();
