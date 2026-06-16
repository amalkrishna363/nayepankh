const express = require('express');
const router = express.Router();
const { client } = require('../api');
const { requireAdmin } = require('../middleware/auth');
const crypto = require('crypto');

router.get('/login', (req, res) => {
  if (req.session.adminId) return res.redirect('/admin/dashboard');
  res.render('login', { error: req.query.error });
});

router.post('/login', async (req, res) => {
  try {
    const resp = await client(req).post('/api/v1/admin/login', req.body);
    req.session.adminId = resp.data.adminId;
    // Forward set-cookie from backend if present
    const setCookie = resp.headers['set-cookie'];
    if (setCookie) res.setHeader('Set-Cookie', setCookie);
    res.redirect('/admin/dashboard');
  } catch (err) {
    res.redirect('/admin/login?error=Invalid+credentials');
  }
});

router.get('/logout', async (req, res) => {
  try { await client(req).post('/api/v1/admin/logout'); } catch (_) {}
  req.session.destroy();
  res.redirect('/admin/login');
});

// API Key management pages
router.get('/api-keys', requireAdmin, async (req, res) => {
  try {
    const resp = await client(req).get('/api/v1/admin/api-keys');
    res.render('admin/api-keys', { keys: resp.data, newKey: req.query.newKey || null });
  } catch (err) {
    res.render('admin/api-keys', { keys: [], newKey: null });
  }
});

router.post('/api-keys', requireAdmin, async (req, res) => {
  try {
    const resp = await client(req).post('/api/v1/admin/api-keys', req.body);
    res.redirect('/admin/api-keys?newKey=' + encodeURIComponent(resp.data.key));
  } catch (_) { res.redirect('/admin/api-keys'); }
});

router.post('/api-keys/delete/:id', requireAdmin, async (req, res) => {
  try { await client(req).delete('/api/v1/admin/api-keys/' + req.params.id); } catch (_) {}
  res.redirect('/admin/api-keys');
});

module.exports = router;
