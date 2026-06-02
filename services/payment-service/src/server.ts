import express from 'express';
import logger from '../../shared/logger';
import { register, metricsMiddleware } from '../../shared/metrics';
import paymentRoutes from './routes/payment.routes';

const app = express();
const PORT = process.env.PORT || 3000;
const SERVICE_NAME = process.env.SERVICE_NAME || 'payment-service';

app.use(express.json());
app.use(metricsMiddleware);
app.use('/payment', paymentRoutes);

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

export default app;
