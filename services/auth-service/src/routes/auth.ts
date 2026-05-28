import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db';
import logger from '../../../shared/logger';

const router = Router();

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'email e password são obrigatórios' });
    return;
  }

  try {
    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [email, password_hash]
    );

    logger.info('Usuário registrado', { userId: result.rows[0].id, email });

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
      'SELECT id, email, password_hash FROM users WHERE email = $1',
      [email]
    );

    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
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

export default router;
