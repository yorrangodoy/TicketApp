import express from 'express';
import cors from 'cors';
import logger from '../../shared/logger';
import { register, metricsMiddleware } from '../../shared/metrics';
import { startConsumer } from './consumer';

const app = express();
const PORT = process.env.PORT || 3000;
const SERVICE_NAME = process.env.SERVICE_NAME || 'notification-service';

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(metricsMiddleware);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: SERVICE_NAME });
});

app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.listen(PORT, () => {
  logger.info(`${SERVICE_NAME} rodando na porta ${PORT}`);
});

// Inicia o consumidor RabbitMQ em paralelo ao servidor HTTP
startConsumer().catch((err: Error) => {
  logger.error('Erro fatal no consumidor RabbitMQ', { error: err.message });
  process.exit(1);
});

export default app;
