import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db';
import logger from '../../../shared/logger';
import { authMiddleware } from '../../../shared/middleware/auth';

const router = Router();

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'email e password são obrigatórios' });
    return;
  }

  const allowedRoles = ['user', 'admin'];
  const userRole: string = role ?? 'user';

  if (!allowedRoles.includes(userRole)) {
    res.status(400).json({ error: 'role inválido. Valores permitidos: user, admin' });
    return;
  }

  try {
    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at',
      [email, password_hash, userRole]
    );

    logger.info('Usuário registrado', { userId: result.rows[0].id, email, role: userRole });

    res.status(201).json({ user: result.rows[0] });
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'Email já cadastrado' });
      return;
    }

    logger.error('Erro ao registrar usuário', { error: err.message });
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'email e password são obrigatórios' });
    return;
  }

  try {
    const result = await pool.query(
      'SELECT id, email, password_hash, role FROM users WHERE email = $1',
      [email]
    );

    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '8h' }
    );

    logger.info('Login realizado', { userId: user.id, email });

    res.json({ token });
  } catch (err: any) {
    logger.error('Erro ao realizar login', { error: err.message });
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.get('/me', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT id, email, role, created_at FROM users WHERE id = $1',
      [req.user!.id]
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    res.json({ user: result.rows[0] });
  } catch (err: any) {
    logger.error('Erro ao buscar usuário', { error: err.message });
    res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
