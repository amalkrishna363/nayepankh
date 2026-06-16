const express = require('express');
const router = express.Router();
const { client } = require('../api');
const { requireAdmin } = require('../middleware/auth');

router.get('/login', (req, res) => {
  if (req.session.adminId) return res.redirect('/admin/dashboard');
  res.render('login', { error: req.query.error });
});

router.post('/login', async (req, res) => {
  try {
    const resp = await client(req).post('/api/v1/admin/login', req.body);
    req.session.adminId = resp.data.adminId;
    req.session.save(() => res.redirect('/admin/dashboard'));
  } catch (err) {
    const msg = err.response?.data?.error || err.message || 'Connection failed';
    console.error('Login error:', msg, '| API_URL:', process.env.API_URL);
    res.redirect('/admin/login?error=' + encodeURIComponent(msg));
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

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
