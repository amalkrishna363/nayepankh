const express = require('express');
const router = express.Router();
const { client } = require('../api');
const { requireAdmin } = require('../middleware/auth');

const PER_PAGE = 10;
const API_KEY = process.env.API_KEY || 'vms_live_demo0000';

router.get('/dashboard', requireAdmin, async (req, res) => {
  const { q = '', status = '', page = 1 } = req.query;
  try {
    const [volRes, statsRes] = await Promise.all([
      client(req).get('/api/v1/volunteers', {
        params: { status, page, limit: PER_PAGE },
        headers: { 'X-Api-Key': API_KEY }
      }),
      client(req).get('/api/v1/admin/stats')
    ]);

    let volunteers = volRes.data.data;
    const total = volRes.data.total;

    // Client-side search filter (q)
    if (q) {
      const lq = q.toLowerCase();
      volunteers = volunteers.filter(v =>
        v.name.toLowerCase().includes(lq) ||
        v.email.toLowerCase().includes(lq) ||
        (v.phone || '').includes(lq) ||
        (v.skills || '').toLowerCase().includes(lq)
      );
    }

    res.render('admin/dashboard', {
      volunteers, stats: statsRes.data, q, status,
      page: parseInt(page),
      totalPages: Math.ceil(total / PER_PAGE),
      total
    });
  } catch (err) {
    res.render('admin/dashboard', {
      volunteers: [], stats: { total:0, active:0, pending:0, inactive:0 },
      q, status, page: 1, totalPages: 1, total: 0
    });
  }
});

router.get('/volunteer/:id', requireAdmin, async (req, res) => {
  try {
    const resp = await client(req).get('/api/v1/volunteers/' + req.params.id,
      { headers: { 'X-Api-Key': API_KEY } });
    res.render('admin/volunteer', { v: resp.data });
  } catch (_) { res.redirect('/admin/dashboard'); }
});

router.get('/volunteer/:id/edit', requireAdmin, async (req, res) => {
  try {
    const resp = await client(req).get('/api/v1/volunteers/' + req.params.id,
      { headers: { 'X-Api-Key': API_KEY } });
    res.render('admin/edit', { v: resp.data, error: null });
  } catch (_) { res.redirect('/admin/dashboard'); }
});

router.post('/volunteer/:id/edit', requireAdmin, async (req, res) => {
  try {
    await client(req).patch('/api/v1/volunteers/' + req.params.id, req.body,
      { headers: { 'X-Api-Key': API_KEY } });
    res.redirect('/admin/volunteer/' + req.params.id);
  } catch (err) {
    try {
      const vRes = await client(req).get('/api/v1/volunteers/' + req.params.id,
        { headers: { 'X-Api-Key': API_KEY } });
      const msg = err.response?.data?.error || 'Update failed';
      res.render('admin/edit', { v: vRes.data, error: msg });
    } catch (_) { res.redirect('/admin/dashboard'); }
  }
});

router.post('/volunteer/:id/status', requireAdmin, async (req, res) => {
  try {
    await client(req).patch('/api/v1/volunteers/' + req.params.id,
      { status: req.body.status }, { headers: { 'X-Api-Key': API_KEY } });
  } catch (_) {}
  res.redirect(req.headers.referer || '/admin/dashboard');
});

router.post('/volunteer/:id/delete', requireAdmin, async (req, res) => {
  try {
    await client(req).delete('/api/v1/volunteers/' + req.params.id,
      { headers: { 'X-Api-Key': API_KEY } });
  } catch (_) {}
  res.redirect('/admin/dashboard');
});

router.get('/reports', requireAdmin, async (req, res) => {
  try {
    const [statsRes, reportsRes] = await Promise.all([
      client(req).get('/api/v1/admin/stats'),
      client(req).get('/api/v1/admin/reports')
    ]);
    res.render('admin/reports', { ...statsRes.data, ...reportsRes.data });
  } catch (_) {
    res.render('admin/reports', { total:0, active:0, pending:0, thisMonth:0, monthly:[], skills:[], byStatus:[] });
  }
});

router.get('/export', requireAdmin, async (req, res) => {
  try {
    const resp = await client(req).get('/api/v1/volunteers',
      { params: { limit: 9999 }, headers: { 'X-Api-Key': API_KEY } });
    const rows = resp.data.data;
    if (!rows.length) return res.send('No data');
    const cols = Object.keys(rows[0]);
    let csv = cols.join(',') + '\n';
    rows.forEach(r => {
      csv += cols.map(c => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(',') + '\n';
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="volunteers.csv"');
    res.send(csv);
  } catch (_) { res.status(500).send('Export failed'); }
});

module.exports = router;
