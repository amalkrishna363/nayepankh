require('dotenv').config();
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
  secret: process.env.SESSION_SECRET || 'nayapankh-frontend-2025',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 4 * 60 * 60 * 1000,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  }
}));

app.use('/', require('./routes/volunteer'));
app.use('/admin', require('./routes/auth'));
app.use('/admin', require('./routes/admin'));

app.use((req, res) => res.status(404).render('404'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🖥️  Nayapankh Frontend → http://localhost:${PORT}`);
  console.log(`   Registration  → http://localhost:${PORT}/`);
  console.log(`   Admin Login   → http://localhost:${PORT}/admin/login`);
  console.log(`   Backend API   → ${process.env.API_URL || 'http://localhost:3001'}\n`);
});
