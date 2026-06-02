import { Pool } from 'pg';
import logger from '../../shared/logger';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initializeDatabase(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id                SERIAL          PRIMARY KEY,
      idempotency_key   VARCHAR(255)    UNIQUE NOT NULL,
      user_id           INTEGER         NOT NULL,
      event_id          INTEGER         NOT NULL,
      quantity          INTEGER         NOT NULL,
      valor_total       NUMERIC(10,2)   NOT NULL,
      metodo_pagamento  VARCHAR(20)     NOT NULL,
      status            VARCHAR(20)     NOT NULL,
      transaction_id    VARCHAR(255),
      created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW()
    )
  `);

  logger.info('Tabela orders verificada/criada com sucesso');
}

export default pool;
