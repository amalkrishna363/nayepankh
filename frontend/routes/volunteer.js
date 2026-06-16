const express = require('express');
const router = express.Router();
const { API } = require('../api');

router.get('/', (req, res) => {
  res.render('register', { success: req.query.success, error: req.query.error });
});

router.post('/', async (req, res) => {
  const { name, email, phone, age, gender, address, skills, availability, emergency_contact } = req.body;
  if (!name || !email || !phone || !age)
    return res.redirect('/?error=Please+fill+in+all+required+fields');
  try {
    await API.post('/api/v1/volunteers', {
      name, email, phone, age: parseInt(age),
      gender: gender || '', address: address || '',
      skills: skills || '', availability: availability || '',
      status: 'Pending', emergency_contact: emergency_contact || ''
    }, { headers: { 'X-Api-Key': process.env.API_KEY || 'vms_live_demo0000' } });
    res.redirect('/?success=Registration+successful!+Thank+you+for+volunteering.');
  } catch (err) {
    const msg = err.response?.data?.error || 'Registration failed';
    if (msg.includes('already')) return res.redirect('/?error=This+email+is+already+registered');
    res.redirect('/?error=' + encodeURIComponent(msg));
  }
});

module.exports = router;
