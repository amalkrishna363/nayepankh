require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function getDb() {
  return pool;
}

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS volunteers (
      id                SERIAL PRIMARY KEY,
      name              TEXT NOT NULL,
      email             TEXT UNIQUE NOT NULL,
      phone             TEXT NOT NULL,
      age               INTEGER NOT NULL,
      gender            TEXT DEFAULT '',
      address           TEXT DEFAULT '',
      skills            TEXT DEFAULT '',
      availability      TEXT DEFAULT '',
      status            TEXT DEFAULT 'Pending',
      emergency_contact TEXT DEFAULT '',
      notes             TEXT DEFAULT '',
      created_at        TIMESTAMPTZ DEFAULT NOW(),
      updated_at        TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS admins (
      id       SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS api_keys (
      id         SERIAL PRIMARY KEY,
      label      TEXT NOT NULL,
      key_hash   TEXT UNIQUE NOT NULL,
      key_prefix TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Seed default admin if not exists
  const adminExists = await pool.query(`SELECT id FROM admins WHERE username = 'admin'`);
  if (!adminExists.rows.length) {
    const hash = bcrypt.hashSync('admin123', 10);
    await pool.query(`INSERT INTO admins (username, password) VALUES ('admin', $1)`, [hash]);
  }

  // Seed default API key if not exists
  const keyExists = await pool.query(`SELECT id FROM api_keys WHERE key_prefix = 'vms_live_demo'`);
  if (!keyExists.rows.length) {
    const rawKey = 'vms_live_demo0000';
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    await pool.query(
      `INSERT INTO api_keys (label, key_hash, key_prefix) VALUES ('Default Key', $1, $2)`,
      [keyHash, rawKey.slice(0, 12)]
    );
  }
}

// Run a SELECT and return array of plain objects
async function query(sql, params = []) {
  // Convert sql.js style ? placeholders to pg style $1,$2...
  let i = 0;
  const pgSql = sql.replace(/\?/g, () => `$${++i}`);
  const result = await pool.query(pgSql, params);
  return result.rows;
}

// Run INSERT/UPDATE/DELETE
async function run(sql, params = []) {
  let i = 0;
  const pgSql = sql.replace(/\?/g, () => `$${++i}`);
  await pool.query(pgSql, params);
}

module.exports = { getDb, initDb, query, run, pool };
