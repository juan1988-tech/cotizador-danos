import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import apiRouter from './routes/index';
import { errorHandler } from './middlewares/errorHandler';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT ?? '3000', 10);
const HOST = process.env.HOST ?? '0.0.0.0';

// ── Global middlewares ────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(morgan(process.env.LOG_FORMAT ?? 'combined'));

// ── Health endpoints ──────────────────────────────────────────────────────────
app.get('/health/liveness', (_req, res) => {
  res.status(200).json({ status: 'alive' });
});

app.get('/health/readiness', (_req, res) => {
  res.status(200).json({ status: 'ready' });
});

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/v1', apiRouter);

// ── Error handler (must be last) ──────────────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});

export default app;
