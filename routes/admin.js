const express = require('express');
const router = express.Router();
const { getDb, query, run } = require('../db');
const { requireAdmin } = require('../middleware/auth');

function buildWhere(q, status) {
  const conditions = ['1=1'];
  const params = [];
  if (q) {
    conditions.push('(name LIKE ? OR email LIKE ? OR phone LIKE ? OR skills LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }
  if (status) { conditions.push('status = ?'); params.push(status); }
  return { where: 'WHERE ' + conditions.join(' AND '), params };
}

router.get('/dashboard', requireAdmin, async (req, res) => {
  await getDb();
  const { q = '', status = '', page = 1 } = req.query;
  const PER_PAGE = 10;
  const offset = (parseInt(page) - 1) * PER_PAGE;
  const { where, params } = buildWhere(q, status);

  const total = query(`SELECT COUNT(*) as cnt FROM volunteers ${where}`, params)[0].cnt;
  const volunteers = query(
    `SELECT * FROM volunteers ${where} ORDER BY created_at DESC LIMIT ${PER_PAGE} OFFSET ${offset}`,
    params
  );

  const stats = {
    total: query(`SELECT COUNT(*) as c FROM volunteers`)[0].c,
    active: query(`SELECT COUNT(*) as c FROM volunteers WHERE status='Active'`)[0].c,
    pending: query(`SELECT COUNT(*) as c FROM volunteers WHERE status='Pending'`)[0].c,
    inactive: query(`SELECT COUNT(*) as c FROM volunteers WHERE status='Inactive'`)[0].c,
  };

  res.render('admin/dashboard', {
    volunteers, stats, q, status,
    page: parseInt(page), totalPages: Math.ceil(total / PER_PAGE), total
  });
});

router.get('/volunteer/:id', requireAdmin, async (req, res) => {
  await getDb();
  const rows = query(`SELECT * FROM volunteers WHERE id = ?`, [req.params.id]);
  if (!rows.length) return res.redirect('/admin/dashboard');
  res.render('admin/volunteer', { v: rows[0] });
});

router.get('/volunteer/:id/edit', requireAdmin, async (req, res) => {
  await getDb();
  const rows = query(`SELECT * FROM volunteers WHERE id = ?`, [req.params.id]);
  if (!rows.length) return res.redirect('/admin/dashboard');
  res.render('admin/edit', { v: rows[0], error: null });
});

router.post('/volunteer/:id/edit', requireAdmin, async (req, res) => {
  const { name, email, phone, age, gender, address, skills, availability, status, emergency_contact, notes } = req.body;
  await getDb();
  try {
    run(`UPDATE volunteers SET
          name=?, email=?, phone=?, age=?, gender=?, address=?, skills=?,
          availability=?, status=?, emergency_contact=?, notes=?,
          updated_at=datetime('now')
         WHERE id=?`,
      [name, email, phone, parseInt(age), gender||'', address||'', skills||'',
       availability||'', status||'Pending', emergency_contact||'', notes||'', req.params.id]);
    res.redirect(`/admin/volunteer/${req.params.id}`);
  } catch (err) {
    const rows = query(`SELECT * FROM volunteers WHERE id = ?`, [req.params.id]);
    res.render('admin/edit', { v: rows[0], error: err.message.includes('UNIQUE') ? 'Email already in use' : err.message });
  }
});

router.post('/volunteer/:id/status', requireAdmin, async (req, res) => {
  await getDb();
  run(`UPDATE volunteers SET status=?, updated_at=datetime('now') WHERE id=?`,
    [req.body.status, req.params.id]);
  res.redirect(req.headers.referer || '/admin/dashboard');
});

router.post('/volunteer/:id/delete', requireAdmin, async (req, res) => {
  await getDb();
  run(`DELETE FROM volunteers WHERE id = ?`, [req.params.id]);
  res.redirect('/admin/dashboard');
});

router.get('/reports', requireAdmin, async (req, res) => {
  await getDb();
  const total   = query(`SELECT COUNT(*) as c FROM volunteers`)[0].c;
  const active  = query(`SELECT COUNT(*) as c FROM volunteers WHERE status='Active'`)[0].c;
  const pending = query(`SELECT COUNT(*) as c FROM volunteers WHERE status='Pending'`)[0].c;
  const thisMonth = query(
    `SELECT COUNT(*) as c FROM volunteers WHERE strftime('%Y-%m', created_at)=strftime('%Y-%m','now')`
  )[0].c;

  const monthly = query(
    `SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
     FROM volunteers GROUP BY month ORDER BY month DESC LIMIT 12`
  );
  const skills = query(
    `SELECT skills, COUNT(*) as count FROM volunteers WHERE skills!=''
     GROUP BY skills ORDER BY count DESC LIMIT 10`
  );
  const byStatus = query(
    `SELECT status, COUNT(*) as count FROM volunteers GROUP BY status`
  );

  res.render('admin/reports', { total, active, pending, thisMonth, monthly, skills, byStatus });
});

router.get('/export', requireAdmin, async (req, res) => {
  await getDb();
  const rows = query(`SELECT id,name,email,phone,age,gender,address,skills,availability,status,emergency_contact,notes,created_at FROM volunteers ORDER BY created_at DESC`);
  if (!rows.length) return res.send('No data');

  const cols = Object.keys(rows[0]);
  let csv = cols.join(',') + '\n';
  rows.forEach(r => {
    csv += cols.map(c => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(',') + '\n';
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="volunteers.csv"');
  res.send(csv);
});

module.exports = router;
