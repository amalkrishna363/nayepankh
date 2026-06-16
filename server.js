const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'nayapankh-vms-2025',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 4 * 60 * 60 * 1000 }
}));

// Public website pages
app.use('/', require('./routes/pages'));

// Admin UI + auth
app.use('/admin', require('./routes/auth'));
app.use('/admin', require('./routes/admin'));

// REST API
app.use('/api/v1/volunteers', require('./routes/api/volunteers'));

// 404
app.use((req, res) => {
  if (req.accepts('html')) return res.status(404).render('404');
  res.status(404).json({ error: 'Not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🕊️  Nayapankh VMS → http://localhost:${PORT}`);
  console.log(`   Admin Login     → http://localhost:${PORT}/admin/login`);
  console.log(`   REST API        → http://localhost:${PORT}/api/v1/volunteers`);
  console.log(`   Admin creds     : admin / admin123`);
  console.log(`   Default API key : vms_live_demo0000\n`);
});
