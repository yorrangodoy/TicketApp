import { Router, Request, Response } from 'express';
import pool from '../db';
import logger from '../../../shared/logger';

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

export default router;
