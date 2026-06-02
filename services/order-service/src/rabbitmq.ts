import amqp from 'amqplib';
import logger from '../../shared/logger';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const EXCHANGE_NAME = 'ticket.exchange';
const ROUTING_KEY = 'payment.confirmed';
// A fila que o notification-service consome
const NOTIFICATION_QUEUE = 'notification.queue';

export interface OrderConfirmedPayload {
  order_id: number;
  user_id: number;
  event_id: number;
}

export async function publishOrderConfirmed(payload: OrderConfirmedPayload): Promise<void> {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  // Garante que exchange e fila existem antes de publicar
  await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
  await channel.assertQueue(NOTIFICATION_QUEUE, { durable: true });
  // Vincula a fila à exchange para que as mensagens cheguem ao notification-service
  await channel.bindQueue(NOTIFICATION_QUEUE, EXCHANGE_NAME, ROUTING_KEY);

  const message = Buffer.from(JSON.stringify(payload));
  channel.publish(EXCHANGE_NAME, ROUTING_KEY, message, { persistent: true });

  logger.info('Evento publicado no RabbitMQ', {
    exchange: EXCHANGE_NAME,
    routingKey: ROUTING_KEY,
    payload,
  });

  await channel.close();
  await connection.close();
}
