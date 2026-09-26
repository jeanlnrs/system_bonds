import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { getDb } from './db.js';
import { requireAuth } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import cuentaRoutes from './routes/cuenta.js';
import carteraRoutes from './routes/cartera.js';

const app = express();

// En Vercel la petición llega a través de su proxy (necesario para el rate limit por IP)
if (process.env.VERCEL) app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '20kb' }));

app.get('/api/health', async (_req, res) => {
  const db = await getDb();
  res.json({ ok: true, db: db.kind });
});

app.use('/api/auth', authRoutes);
app.use('/api/cuenta', requireAuth, cuentaRoutes);
app.use('/api/cartera', requireAuth, carteraRoutes);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Recurso no encontrado.' }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Ocurrió un error inesperado. Inténtalo de nuevo.' });
});

export default app;
