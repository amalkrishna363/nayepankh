const express = require('express');
const router = express.Router();
const { getDb, run } = require('../db');

router.get('/', (req, res) => {
  res.render('register', { success: req.query.success, error: req.query.error });
});

router.post('/', async (req, res) => {
  const { name, email, phone, age, gender, address, skills, availability, emergency_contact } = req.body;
  if (!name || !email || !phone || !age)
    return res.redirect('/?error=Please+fill+in+all+required+fields');

  try {
    await getDb();
    run(
      `INSERT INTO volunteers (name,email,phone,age,gender,address,skills,availability,status,emergency_contact)
       VALUES (?,?,?,?,?,?,?,?,'Pending',?)`,
      [name, email, phone, parseInt(age), gender||'', address||'', skills||'', availability||'', emergency_contact||'']
    );
    res.redirect('/?success=Registration+successful!+Thank+you+for+volunteering.');
  } catch (err) {
    if (err.message.includes('UNIQUE'))
      return res.redirect('/?error=This+email+is+already+registered');
    res.redirect('/?error=Registration+failed.+Please+try+again.');
  }
});

module.exports = router;
