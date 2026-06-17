// rebuild: logger com buffer de memoria
import express from 'express';
import cors from 'cors';
import logger from '../../shared/logger';
import { getLogBuffer } from '../../shared/logger';
import { authMiddleware, adminMiddleware } from '../../shared/middleware/auth';
import { register, metricsMiddleware } from '../../shared/metrics';
import { initializeDatabase } from './db';
import eventRoutes from './routes/events';

const app = express();
const PORT = process.env.PORT || 3000;
const SERVICE_NAME = process.env.SERVICE_NAME || 'event-service';

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(metricsMiddleware);
app.use('/events', eventRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: SERVICE_NAME });
});

app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.get('/logs', authMiddleware, adminMiddleware, (_req, res) => {
  res.json({ logs: getLogBuffer() });
});

async function start(): Promise<void> {
  await initializeDatabase();
  app.listen(PORT, () => {
    logger.info(`${SERVICE_NAME} rodando na porta ${PORT}`);
  });
}

start().catch((err) => {
  logger.error('Falha ao inicializar o serviço', { error: err.message });
  process.exit(1);
});

export default app;
