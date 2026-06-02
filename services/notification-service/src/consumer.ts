import amqp, { ChannelModel, Channel, ConsumeMessage } from 'amqplib';
import logger from '../../shared/logger';

const QUEUE_NAME = 'notification.queue';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';

interface NotificationMessage {
  order_id: string;
  email: string;
  evento: string;
}

async function processarMensagem(msg: ConsumeMessage): Promise<void> {
  const conteudo = JSON.parse(msg.content.toString()) as NotificationMessage;
  const { order_id, email, evento } = conteudo;

  // Simula latência de envio de e-mail por SMTP
  await new Promise((resolve) => setTimeout(resolve, 300));

  logger.info(`E-mail de confirmação enviado para ${email} - pedido ${order_id}`, {
    order_id,
    email,
    evento,
  });
}

async function conectar(): Promise<{ connection: ChannelModel; channel: Channel }> {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertQueue(QUEUE_NAME, { durable: true });
  // Processa uma mensagem por vez para não sobrecarregar o serviço
  channel.prefetch(1);

  return { connection, channel };
}

export async function startConsumer(): Promise<void> {
  let tentativa = 0;

  while (true) {
    try {
      logger.info('Conectando ao RabbitMQ...', { url: RABBITMQ_URL });

      const { connection, channel } = await conectar();
      tentativa = 0;

      logger.info(`Consumidor ativo. Aguardando mensagens na fila "${QUEUE_NAME}"`);

      channel.consume(
        QUEUE_NAME,
        async (msg) => {
          if (!msg) return;

          try {
            await processarMensagem(msg);
            channel.ack(msg);
          } catch (err) {
            const error = err as Error;
            logger.error('Erro ao processar mensagem. Descartando da fila', {
              error: error.message,
            });
            // nack sem requeue para evitar loop de mensagens com defeito
            channel.nack(msg, false, false);
          }
        },
        { noAck: false },
      );

      // Mantém o loop vivo até a conexão cair
      await new Promise<void>((_, reject) => {
        connection.on('error', (err: Error) => reject(err));
        connection.on('close', () => reject(new Error('Conexão com RabbitMQ encerrada')));
      });
    } catch (err) {
      const error = err as Error;
      tentativa++;
      const delayMs = Math.min(1000 * Math.pow(2, tentativa - 1), 30000);
      logger.warn(`Falha na conexão com RabbitMQ. Tentativa ${tentativa}. Reconectando em ${delayMs}ms`, {
        error: error.message,
      });
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
