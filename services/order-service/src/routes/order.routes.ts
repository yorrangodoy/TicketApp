import { Router, Request, Response } from 'express';
import axios from 'axios';
import pool from '../db';
import logger from '../../../shared/logger';
import { authMiddleware } from '../../../shared/middleware/auth';
import { getEvent, reserveTickets } from '../clients/event.client';
import { processPayment } from '../clients/payment.client';
import { publishOrderConfirmed } from '../rabbitmq';

const router = Router();

// Retry com backoff exponencial — isola a lógica de resiliência para reutilização
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number,
  delays: number[],
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const delay = delays[attempt];
      if (attempt < maxAttempts - 1 && delay !== undefined) {
        logger.warn(`Tentativa ${attempt + 1}/${maxAttempts} falhou. Aguardando ${delay}ms`, {
          error: (err as Error).message,
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// POST /orders — fluxo principal de compra de ingresso
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  // a. Idempotency-Key obrigatório: garante que requisições duplicadas (retry do cliente)
  //    não gerem múltiplos pedidos nem cobranças duplicadas
  const idempotencyKey = req.headers['idempotency-key'] as string | undefined;

  if (!idempotencyKey) {
    res.status(400).json({ error: 'Header Idempotency-Key é obrigatório' });
    return;
  }

  // b. Idempotência: retorna o pedido existente sem reprocessar nenhuma etapa
  const existing = await pool.query(
    'SELECT * FROM orders WHERE idempotency_key = $1',
    [idempotencyKey],
  );

  if (existing.rows[0]) {
    logger.info('Requisição idempotente: retornando pedido já existente', {
      idempotencyKey,
      orderId: existing.rows[0].id,
    });
    res.status(200).json({ order: existing.rows[0] });
    return;
  }

  // c. Validação do body
  const { event_id, quantity, metodo_pagamento } = req.body as {
    event_id: number;
    quantity: number;
    metodo_pagamento: string;
  };

  if (!event_id || !quantity || !metodo_pagamento) {
    res.status(400).json({ error: 'event_id, quantity e metodo_pagamento são obrigatórios' });
    return;
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    res.status(400).json({ error: 'quantity deve ser um inteiro maior que zero' });
    return;
  }

  if (!['boleto', 'pix', 'cartao'].includes(metodo_pagamento)) {
    res.status(400).json({ error: 'metodo_pagamento inválido. Use: boleto, pix ou cartao' });
    return;
  }

  const userId = req.user!.id;
  const userEmail = req.user!.email;

  try {
    // d. Busca preço do evento no event-service para calcular valor_total
    let event;
    try {
      event = await getEvent(event_id);
    } catch (err) {
      logger.error('Falha ao consultar event-service', { error: (err as Error).message, event_id });
      res.status(502).json({ error: 'Serviço de eventos indisponível' });
      return;
    }

    const valorTotal = Number(event.price) * quantity;

    // e. Persiste o pedido como 'pendente' antes de qualquer chamada externa.
    //    Garante rastreabilidade mesmo que o processo falhe nas etapas seguintes.
    let order: Record<string, unknown>;
    try {
      const orderResult = await pool.query(
        `INSERT INTO orders
           (idempotency_key, user_id, event_id, quantity, valor_total, metodo_pagamento, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'pendente')
         RETURNING *`,
        [idempotencyKey, userId, event_id, quantity, valorTotal, metodo_pagamento],
      );
      order = orderResult.rows[0];
    } catch (err) {
      // Trata race condition: dois requests com a mesma idempotency_key chegaram ao mesmo tempo
      if ((err as { code?: string }).code === '23505') {
        const race = await pool.query(
          'SELECT * FROM orders WHERE idempotency_key = $1',
          [idempotencyKey],
        );
        res.status(200).json({ order: race.rows[0] });
        return;
      }
      throw err;
    }

    logger.info('Pedido criado com status pendente', {
      orderId: order['id'],
      userId,
      event_id,
      valorTotal,
    });

    // f. Reserva ingressos no event-service — usa SELECT FOR UPDATE para anti-overselling.
    //    O event-service é a única fonte de verdade para o estoque disponível.
    try {
      await reserveTickets(event_id, quantity);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        await pool.query("UPDATE orders SET status = 'recusado' WHERE id = $1", [order['id']]);
        logger.warn('Reserva negada: ingressos insuficientes', {
          orderId: order['id'],
          event_id,
          quantity,
        });
        res.status(409).json({ error: 'Ingressos insuficientes para este evento' });
        return;
      }
      await pool.query("UPDATE orders SET status = 'falha' WHERE id = $1", [order['id']]);
      logger.error('Falha ao reservar ingressos', {
        error: (err as Error).message,
        orderId: order['id'],
      });
      res.status(502).json({ error: 'Falha ao reservar ingressos' });
      return;
    }

    // g. Processa pagamento com retry e backoff exponencial (500ms → 1s → 2s).
    //    Retries protegem contra falhas transitórias do payment-service.
    let paymentResult;
    let paymentFailed = false;

    try {
      paymentResult = await withRetry(
        () => processPayment(order['id'] as number, valorTotal, metodo_pagamento),
        3,
        [500, 1000, 2000],
      );
    } catch (err) {
      paymentFailed = true;
      logger.error('Pagamento falhou após todas as tentativas de retry', {
        error: (err as Error).message,
        orderId: order['id'],
      });
    }

    // h. Compensação: desfaz a reserva de estoque se o pagamento não for aprovado.
    //    Padrão SAGA — garante que o estoque não fique preso em pedidos não confirmados.
    if (paymentFailed || paymentResult?.status === 'recusado') {
      try {
        // Devolve os ingressos ao estoque usando quantity negativa (rollback da reserva)
        await reserveTickets(event_id, -quantity);
        logger.info('Estoque compensado com sucesso após falha no pagamento', {
          orderId: order['id'],
          event_id,
          quantity,
        });
      } catch (compensationErr) {
        // Falha na compensação: inconsistência de estoque — requer intervenção manual ou DLQ
        logger.error('FALHA CRÍTICA NA COMPENSAÇÃO DE ESTOQUE — revisão manual necessária', {
          orderId: order['id'],
          event_id,
          quantity,
          error: (compensationErr as Error).message,
        });
      }

      const novoStatus = paymentFailed ? 'falha' : 'recusado';
      await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [novoStatus, order['id']]);

      if (paymentFailed) {
        res.status(502).json({ error: 'Falha na comunicação com o serviço de pagamento', order_id: order['id'] });
      } else {
        res.status(402).json({ error: 'Pagamento recusado', order_id: order['id'] });
      }
      return;
    }

    // i. Sucesso: atualiza pedido para 'confirmado' e notifica outros serviços
    await pool.query(
      "UPDATE orders SET status = 'confirmado', transaction_id = $1 WHERE id = $2",
      [paymentResult!.transaction_id, order['id']],
    );

    // Publica evento no RabbitMQ para o notification-service enviar e-mail de confirmação.
    // Falha no RabbitMQ NÃO cancela o pedido — o pagamento já foi aprovado.
    try {
      await publishOrderConfirmed({
        order_id: order['id'] as number,
        user_id: userId,
        event_id,
        email: userEmail,
        evento: event.title,
      });
    } catch (mqErr) {
      logger.error('Falha ao publicar confirmação no RabbitMQ — notificação perdida', {
        error: (mqErr as Error).message,
        orderId: order['id'],
      });
    }

    logger.info('Pedido confirmado com sucesso', {
      orderId: order['id'],
      transactionId: paymentResult!.transaction_id,
      userId,
      event_id,
    });

    const confirmedOrder = await pool.query('SELECT * FROM orders WHERE id = $1', [order['id']]);
    res.status(201).json({ order: confirmedOrder.rows[0] });
  } catch (err) {
    logger.error('Erro inesperado ao processar pedido', { error: (err as Error).message });
    res.status(500).json({ error: 'Erro interno ao processar pedido' });
  }
});

// GET /orders/:id — consulta status de um pedido específico
router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params['id'], 10);

  if (isNaN(id)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  try {
    const result = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Pedido não encontrado' });
      return;
    }

    // Garante que cada usuário só visualiza seus próprios pedidos
    if (result.rows[0].user_id !== req.user!.id) {
      res.status(403).json({ error: 'Acesso negado' });
      return;
    }

    res.json({ order: result.rows[0] });
  } catch (err) {
    logger.error('Erro ao buscar pedido', { error: (err as Error).message, orderId: id });
    res.status(500).json({ error: 'Erro interno' });
  }
});

// GET /orders — lista todos os pedidos do usuário autenticado
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;

  try {
    const result = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [userId],
    );

    res.json({ orders: result.rows });
  } catch (err) {
    logger.error('Erro ao listar pedidos', { error: (err as Error).message, userId });
    res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
