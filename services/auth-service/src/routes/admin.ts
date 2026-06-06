import { Router, Request, Response } from 'express';
import pool from '../db';
import logger from '../../../shared/logger';
import { authMiddleware, adminMiddleware } from '../../../shared/middleware/auth';

const router = Router();

// GET /admin/users — lista todos os usuários (apenas admin)
router.get('/users', authMiddleware, adminMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT id, email, role, created_at FROM users ORDER BY created_at ASC'
    );
    res.json({ users: result.rows });
  } catch (err: any) {
    logger.error('Erro ao listar usuários', { error: err.message });
    res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
