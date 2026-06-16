const express = require('express');
const router = express.Router();
const { getDb, query, run } = require('../../db');
const { requireApiKey } = require('../../middleware/auth');

router.use(requireApiKey);

// GET /api/v1/volunteers
router.get('/', async (req, res) => {
  await getDb();
  const { status, skills, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = 'WHERE 1=1';
  const params = [];
  if (status) { where += ' AND status = ?'; params.push(status); }
  if (skills)  { where += ' AND skills LIKE ?'; params.push(`%${skills}%`); }

  const total = query(`SELECT COUNT(*) as cnt FROM volunteers ${where}`, params)[0].cnt;
  params.push(parseInt(limit), offset);
  const volunteers = query(
    `SELECT * FROM volunteers ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, params
  );

  res.json({ total, page: parseInt(page), limit: parseInt(limit), data: volunteers });
});

// GET /api/v1/volunteers/:id
router.get('/:id', async (req, res) => {
  await getDb();
  const rows = query(`SELECT * FROM volunteers WHERE id = ?`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Volunteer not found' });
  res.json(rows[0]);
});

// POST /api/v1/volunteers
router.post('/', async (req, res) => {
  await getDb();
  const { name, email, phone, age, gender, address, skills, availability, status, emergency_contact, notes } = req.body;
  if (!name || !email || !phone || !age)
    return res.status(400).json({ error: 'name, email, phone, age are required' });

  try {
    run(`INSERT INTO volunteers (name,email,phone,age,gender,address,skills,availability,status,emergency_contact,notes)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [name, email, phone, parseInt(age), gender||'', address||'', skills||'',
       availability||'', status||'Pending', emergency_contact||'', notes||'']);

    const created = query(`SELECT * FROM volunteers WHERE email = ?`, [email])[0];
    res.status(201).json(created);
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/v1/volunteers/:id
router.patch('/:id', async (req, res) => {
  await getDb();
  const rows = query(`SELECT * FROM volunteers WHERE id = ?`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Volunteer not found' });

  const fields = ['name','email','phone','age','gender','address','skills','availability','status','emergency_contact','notes'];
  const updates = [];
  const params = [];
  fields.forEach(f => {
    if (req.body[f] !== undefined) { updates.push(`${f} = ?`); params.push(req.body[f]); }
  });
  if (!updates.length) return res.status(400).json({ error: 'No fields to update' });

  updates.push(`updated_at = datetime('now')`);
  params.push(req.params.id);
  run(`UPDATE volunteers SET ${updates.join(', ')} WHERE id = ?`, params);

  res.json(query(`SELECT * FROM volunteers WHERE id = ?`, [req.params.id])[0]);
});

// DELETE /api/v1/volunteers/:id
router.delete('/:id', async (req, res) => {
  await getDb();
  const rows = query(`SELECT id FROM volunteers WHERE id = ?`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Volunteer not found' });
  run(`DELETE FROM volunteers WHERE id = ?`, [req.params.id]);
  res.json({ message: 'Deleted successfully' });
});

module.exports = router;
