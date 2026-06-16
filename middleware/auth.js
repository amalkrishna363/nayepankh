const crypto = require('crypto');
const { getDb, query } = require('../db');

function requireAdmin(req, res, next) {
  if (req.session && req.session.adminId) return next();
  // API callers get JSON 401
  if (req.path.startsWith('/api')) return res.status(401).json({ error: 'Unauthorized' });
  res.redirect('/admin/login');
}

async function requireApiKey(req, res, next) {
  const raw = req.headers['x-api-key'];
  if (!raw) return res.status(401).json({ error: 'Missing X-Api-Key header' });

  await getDb();
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  const rows = query(`SELECT id FROM api_keys WHERE key_hash = ?`, [hash]);
  if (!rows.length) return res.status(401).json({ error: 'Invalid API key' });

  next();
}

module.exports = { requireAdmin, requireApiKey };
