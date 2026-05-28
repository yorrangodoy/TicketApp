import express from 'express';
import logger from '../../shared/logger';
import { register, metricsMiddleware } from '../../shared/metrics';
import { initializeDatabase } from './db';
import authRoutes from './routes/auth';

const app = express();
const PORT = process.env.PORT || 3000;
const SERVICE_NAME = process.env.SERVICE_NAME || 'auth-service';

app.use(express.json());
app.use(metricsMiddleware);
app.use('/auth', authRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: SERVICE_NAME });
});

app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
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
