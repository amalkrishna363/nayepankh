const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { getDb, query, run } = require('../db');
const { requireAdmin } = require('../middleware/auth');

router.get('/login', (req, res) => {
  if (req.session.adminId) return res.redirect('/admin/dashboard');
  res.render('login', { error: req.query.error });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  await getDb();
  const rows = query(`SELECT * FROM admins WHERE username = ?`, [username]);
  if (!rows.length || !bcrypt.compareSync(password, rows[0].password))
    return res.redirect('/admin/login?error=Invalid+credentials');
  req.session.adminId = rows[0].id;
  res.redirect('/admin/dashboard');
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// API Key management
router.get('/api-keys', requireAdmin, async (req, res) => {
  await getDb();
  const keys = query(`SELECT id, label, key_prefix, created_at FROM api_keys ORDER BY created_at DESC`);
  res.render('admin/api-keys', { keys, newKey: req.query.newKey || null });
});

router.post('/api-keys', requireAdmin, async (req, res) => {
  const { label } = req.body;
  if (!label) return res.redirect('/admin/api-keys');
  const rawKey = 'vms_' + crypto.randomBytes(20).toString('hex');
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  await getDb();
  run(`INSERT INTO api_keys (label, key_hash, key_prefix) VALUES (?, ?, ?)`,
    [label, keyHash, rawKey.slice(0, 12)]);
  res.redirect(`/admin/api-keys?newKey=${encodeURIComponent(rawKey)}`);
});

router.post('/api-keys/delete/:id', requireAdmin, async (req, res) => {
  await getDb();
  run(`DELETE FROM api_keys WHERE id = ?`, [req.params.id]);
  res.redirect('/admin/api-keys');
});

module.exports = router;
