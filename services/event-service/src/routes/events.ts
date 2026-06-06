import { Router, Request, Response } from 'express';
import pool from '../db';
import logger from '../../../shared/logger';
import { authMiddleware, adminMiddleware } from '../../../shared/middleware/auth';

const router = Router();

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT id, title, description, date, venue, total_tickets, available_tickets, price, created_at FROM events ORDER BY date ASC'
    );

    res.json({ events: result.rows });
  } catch (err: any) {
    logger.error('Erro ao listar eventos', { error: err.message });
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  try {
    const result = await pool.query(
      'SELECT id, title, description, date, venue, total_tickets, available_tickets, price, created_at FROM events WHERE id = $1',
      [id]
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Evento não encontrado' });
      return;
    }

    res.json({ event: result.rows[0] });
  } catch (err: any) {
    logger.error('Erro ao buscar evento', { error: err.message, eventId: id });
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.post('/', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { title, description, date, venue, total_tickets, price } = req.body;

  if (!title || !date || !venue || total_tickets == null || price == null) {
    res.status(400).json({ error: 'title, date, venue, total_tickets e price são obrigatórios' });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO events (title, description, date, venue, total_tickets, available_tickets, price)
       VALUES ($1, $2, $3, $4, $5, $5, $6)
       RETURNING *`,
      [title, description ?? null, date, venue, total_tickets, price]
    );

    logger.info('Evento criado', { eventId: result.rows[0].id, userId: req.user!.id });

    res.status(201).json({ event: result.rows[0] });
  } catch (err: any) {
    logger.error('Erro ao criar evento', { error: err.message });
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.put('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  const { title, description, date, venue, total_tickets, price } = req.body;

  try {
    const result = await pool.query(
      `UPDATE events
       SET title             = COALESCE($1, title),
           description       = COALESCE($2, description),
           date              = COALESCE($3, date),
           venue             = COALESCE($4, venue),
           total_tickets     = COALESCE($5, total_tickets),
           price             = COALESCE($6, price)
       WHERE id = $7
       RETURNING *`,
      [title ?? null, description ?? null, date ?? null, venue ?? null, total_tickets ?? null, price ?? null, id]
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Evento não encontrado' });
      return;
    }

    logger.info('Evento atualizado', { eventId: id, userId: req.user!.id });

    res.json({ event: result.rows[0] });
  } catch (err: any) {
    logger.error('Erro ao atualizar evento', { error: err.message, eventId: id });
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  try {
    const result = await pool.query(
      'DELETE FROM events WHERE id = $1 RETURNING id',
      [id]
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Evento não encontrado' });
      return;
    }

    logger.info('Evento removido', { eventId: id, userId: req.user!.id });

    res.status(204).send();
  } catch (err: any) {
    logger.error('Erro ao remover evento', { error: err.message, eventId: id });
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.patch('/:id/reserve', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  const quantity = req.body.quantity ?? 1;

  if (!Number.isInteger(quantity) || quantity < 1) {
    res.status(400).json({ error: 'quantity deve ser um inteiro maior ou igual a 1' });
    return;
  }

  // Client dedicado: a transação precisa rodar toda na MESMA conexão.
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // SELECT ... FOR UPDATE trava a linha do evento até o COMMIT/ROLLBACK.
    // Requisições concorrentes ficam em fila aqui, evitando overselling.
    const lockResult = await client.query(
      'SELECT id, available_tickets FROM events WHERE id = $1 FOR UPDATE',
      [id]
    );

    const event = lockResult.rows[0];

    if (!event) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Evento não encontrado' });
      return;
    }

    if (event.available_tickets < quantity) {
      await client.query('ROLLBACK');
      res.status(409).json({
        error: 'Ingressos insuficientes',
        available_tickets: event.available_tickets,
        requested: quantity,
      });
      return;
    }

    const updateResult = await client.query(
      'UPDATE events SET available_tickets = available_tickets - $1 WHERE id = $2 RETURNING id, available_tickets',
      [quantity, id]
    );

    await client.query('COMMIT');

    logger.info('Ingressos reservados', { eventId: id, quantity, remaining: updateResult.rows[0].available_tickets });

    res.json({ event: updateResult.rows[0], reserved: quantity });
  } catch (err: any) {
    await client.query('ROLLBACK');
    logger.error('Erro ao reservar ingressos', { error: err.message, eventId: id });
    res.status(500).json({ error: 'Erro interno' });
  } finally {
    // Sempre devolve o client ao pool, mesmo em erro.
    client.release();
  }
});

export default router;
