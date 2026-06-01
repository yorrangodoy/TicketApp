import { Router, Request, Response } from 'express';
import pool from '../db';
import logger from '../../../shared/logger';
import { authMiddleware } from '../../../shared/middleware/auth';

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

router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
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

router.put('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
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

router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
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

export default router;
