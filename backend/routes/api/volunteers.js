const express = require('express');
const router = express.Router();
const { query, run } = require('../../db');
const { requireApiKey } = require('../../middleware/auth');

router.use(requireApiKey);

// GET /api/v1/volunteers
router.get('/', async (req, res) => {
  try {
    const { status, skills, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = 'WHERE 1=1';
    const params = [];
    if (status) { params.push(status);         where += ` AND status = ?`; }
    if (skills) { params.push(`%${skills}%`);  where += ` AND skills ILIKE ?`; }

    const countRows = await query(`SELECT COUNT(*) as cnt FROM volunteers ${where}`, params);
    const total = parseInt(countRows[0].cnt);

    const data = await query(
      `SELECT * FROM volunteers ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    res.json({ total, page: parseInt(page), limit: parseInt(limit), data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/volunteers/:id
router.get('/:id', async (req, res) => {
  try {
    const rows = await query(`SELECT * FROM volunteers WHERE id = ?`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Volunteer not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/volunteers
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, age, gender, address, skills, availability, status, emergency_contact, notes } = req.body;
    if (!name || !email || !phone || !age)
      return res.status(400).json({ error: 'name, email, phone, age are required' });

    await run(
      `INSERT INTO volunteers (name,email,phone,age,gender,address,skills,availability,status,emergency_contact,notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [name, email, phone, parseInt(age), gender||'', address||'', skills||'',
       availability||'', status||'Pending', emergency_contact||'', notes||'']
    );
    const created = await query(`SELECT * FROM volunteers WHERE email = ?`, [email]);
    res.status(201).json(created[0]);
  } catch (err) {
    if (err.message.includes('unique') || err.message.includes('duplicate'))
      return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/v1/volunteers/:id
router.patch('/:id', async (req, res) => {
  try {
    const rows = await query(`SELECT * FROM volunteers WHERE id = ?`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Volunteer not found' });

    const fields = ['name','email','phone','age','gender','address','skills','availability','status','emergency_contact','notes'];
    const updates = [];
    const params = [];
    fields.forEach(f => {
      if (req.body[f] !== undefined) { updates.push(`${f} = ?`); params.push(req.body[f]); }
    });
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
    updates.push(`updated_at = NOW()`);
    params.push(req.params.id);
    await run(`UPDATE volunteers SET ${updates.join(', ')} WHERE id = ?`, params);
    const updated = await query(`SELECT * FROM volunteers WHERE id = ?`, [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/v1/volunteers/:id
router.delete('/:id', async (req, res) => {
  try {
    const rows = await query(`SELECT id FROM volunteers WHERE id = ?`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Volunteer not found' });
    await run(`DELETE FROM volunteers WHERE id = ?`, [req.params.id]);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
