const { Pool } = require('pg');
require('dotenv').config();

const defaultLocal = 'postgres://postgres:postgres@localhost:5432/releasecheck';
const connectionUrl = process.env.DATABASE_URL || defaultLocal;
const sslConfig = process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false;

const pool = new Pool({
  connectionString: connectionUrl,
  ssl: sslConfig,
});

const initDb = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS releases (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      due_date TIMESTAMP NOT NULL,
      additional_info TEXT,
      steps JSONB NOT NULL DEFAULT '[]',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
};

module.exports = { pool, initDb };