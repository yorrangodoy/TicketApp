import { Pool } from 'pg';
import logger from '../../shared/logger';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initializeDatabase(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      email         VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role          VARCHAR(20)  NOT NULL DEFAULT 'user',
      created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `);

  // Garante que a coluna role existe em bancos criados antes desta versão
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user'
  `);

  logger.info('Tabela users verificada/criada com sucesso');
}

export default pool;
