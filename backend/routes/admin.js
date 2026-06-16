const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { query, run } = require('../db');

function requireAdmin(req, res, next) {
  if (req.session && req.session.adminId) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

// POST /api/v1/admin/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const rows = await query(`SELECT * FROM admins WHERE username = ?`, [username]);
    if (!rows.length || !bcrypt.compareSync(password, rows[0].password))
      return res.status(401).json({ error: 'Invalid credentials' });
    req.session.adminId = rows[0].id;
    res.json({ message: 'Logged in', adminId: rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/admin/logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out' });
});

// GET /api/v1/admin/stats
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [total, active, pending, inactive, thisMonth] = await Promise.all([
      query(`SELECT COUNT(*) as c FROM volunteers`),
      query(`SELECT COUNT(*) as c FROM volunteers WHERE status='Active'`),
      query(`SELECT COUNT(*) as c FROM volunteers WHERE status='Pending'`),
      query(`SELECT COUNT(*) as c FROM volunteers WHERE status='Inactive'`),
      query(`SELECT COUNT(*) as c FROM volunteers WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())`)
    ]);
    res.json({
      total:     parseInt(total[0].c),
      active:    parseInt(active[0].c),
      pending:   parseInt(pending[0].c),
      inactive:  parseInt(inactive[0].c),
      thisMonth: parseInt(thisMonth[0].c)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/admin/reports
router.get('/reports', requireAdmin, async (req, res) => {
  try {
    const [monthly, skills, byStatus] = await Promise.all([
      query(`SELECT TO_CHAR(created_at,'YYYY-MM') as month, COUNT(*) as count FROM volunteers GROUP BY month ORDER BY month DESC LIMIT 12`),
      query(`SELECT skills, COUNT(*) as count FROM volunteers WHERE skills != '' GROUP BY skills ORDER BY count DESC LIMIT 10`),
      query(`SELECT status, COUNT(*) as count FROM volunteers GROUP BY status`)
    ]);
    res.json({ monthly, skills, byStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/admin/api-keys
router.get('/api-keys', requireAdmin, async (req, res) => {
  try {
    const keys = await query(`SELECT id, label, key_prefix, created_at FROM api_keys ORDER BY created_at DESC`);
    res.json(keys);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/admin/api-keys
router.post('/api-keys', requireAdmin, async (req, res) => {
  try {
    const { label } = req.body;
    if (!label) return res.status(400).json({ error: 'label is required' });
    const rawKey = 'vms_' + crypto.randomBytes(20).toString('hex');
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    await run(`INSERT INTO api_keys (label, key_hash, key_prefix) VALUES (?, ?, ?)`,
      [label, keyHash, rawKey.slice(0, 12)]);
    res.status(201).json({ label, key: rawKey, prefix: rawKey.slice(0, 12) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/v1/admin/api-keys/:id
router.delete('/api-keys/:id', requireAdmin, async (req, res) => {
  try {
    await run(`DELETE FROM api_keys WHERE id = ?`, [req.params.id]);
    res.json({ message: 'Revoked' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = { router, requireAdmin };
