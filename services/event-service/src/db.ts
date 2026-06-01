import { Pool } from 'pg';
import logger from '../../shared/logger';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initializeDatabase(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS events (
      id                SERIAL        PRIMARY KEY,
      title             VARCHAR(255)  NOT NULL,
      description       TEXT,
      date              TIMESTAMPTZ   NOT NULL,
      venue             VARCHAR(255)  NOT NULL,
      total_tickets     INTEGER       NOT NULL CHECK (total_tickets > 0),
      available_tickets INTEGER       NOT NULL CHECK (available_tickets >= 0),
      price             NUMERIC(10,2) NOT NULL CHECK (price >= 0),
      created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    )
  `);

  logger.info('Tabela events verificada/criada com sucesso');
}

export default pool;
