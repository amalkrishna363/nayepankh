const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, 'data.sqlite');
let db;

async function getDb() {
  if (db) return db;
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    db = new SQL.Database();
    db.run(`
      CREATE TABLE IF NOT EXISTS volunteers (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT NOT NULL,
        email       TEXT UNIQUE NOT NULL,
        phone       TEXT NOT NULL,
        age         INTEGER NOT NULL,
        gender      TEXT DEFAULT '',
        address     TEXT DEFAULT '',
        skills      TEXT DEFAULT '',
        availability TEXT DEFAULT '',
        status      TEXT DEFAULT 'Pending',
        emergency_contact TEXT DEFAULT '',
        notes       TEXT DEFAULT '',
        created_at  TEXT DEFAULT (datetime('now')),
        updated_at  TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS admins (
        id       INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS api_keys (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        label      TEXT NOT NULL,
        key_hash   TEXT UNIQUE NOT NULL,
        key_prefix TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    const hash = bcrypt.hashSync('admin123', 10);
    db.run(`INSERT INTO admins (username, password) VALUES ('admin', ?)`, [hash]);

    // Seed a default API key: vms_live_demo0000
    const rawKey = 'vms_live_demo0000';
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    db.run(`INSERT INTO api_keys (label, key_hash, key_prefix) VALUES ('Default Key', ?, ?)`,
      [keyHash, rawKey.slice(0, 12)]);

    save();
  }
  return db;
}

function save() {
  if (db) fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
}

// Helper: exec a query and return array of plain objects
function query(sql, params = []) {
  const result = db.exec(sql, params);
  if (!result.length) return [];
  const { columns, values } = result[0];
  return values.map(row => Object.fromEntries(columns.map((c, i) => [c, row[i]])));
}

// Helper: run and return lastInsertRowId
function run(sql, params = []) {
  db.run(sql, params);
  save();
}

module.exports = { getDb, save, query, run };
