require('dotenv').config();
const crypto = require('crypto');
const { query } = require('../db');

async function requireApiKey(req, res, next) {
  const raw = req.headers['x-api-key'];
  if (!raw) return res.status(401).json({ error: 'Missing X-Api-Key header' });
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  const rows = await query(`SELECT id FROM api_keys WHERE key_hash = ?`, [hash]);
  if (!rows.length) return res.status(401).json({ error: 'Invalid API key' });
  next();
}

module.exports = { requireApiKey };
