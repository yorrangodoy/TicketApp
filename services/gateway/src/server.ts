// rebuild: logger com buffer de memoria
/* Ponto de entrada do gateway: consolida order, payment e notification num único processo */

import express from 'express';
import cors from 'cors';

import logger from '../../shared/logger';
import { getLogBuffer } from '../../shared/logger';
import { authMiddleware, adminMiddleware } from '../../shared/middleware/auth';
import orderRoutes from '../../order-service/src/routes/order.routes';
import paymentRoutes from '../../payment-service/src/routes/payment.routes';
import { startConsumer } from '../../notification-service/src/consumer';
import { initializeDatabase } from '../../order-service/src/db';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/orders', orderRoutes);
app.use('/payment', paymentRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'gateway' }));

app.get('/logs', authMiddleware, adminMiddleware, (_req, res) => {
  res.json({ logs: getLogBuffer() });
});

async function start(): Promise<void> {
  await initializeDatabase();

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    logger.info(`Gateway rodando na porta ${PORT}`);
  });

  startConsumer().catch((err: Error) => {
    logger.error('Erro fatal no consumer RabbitMQ', { error: err.message });
  });
}

start().catch((err: Error) => {
  logger.error('Falha ao inicializar gateway', { error: err.message });
  process.exit(1);
});
