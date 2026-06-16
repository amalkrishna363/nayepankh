require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const { initDb } = require('./db');

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'nayapankh-backend-2025',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 4 * 60 * 60 * 1000,
    sameSite: 'none',
    secure: process.env.NODE_ENV === 'production'
  }
}));

app.use('/api/v1/volunteers', require('./routes/api/volunteers'));
app.use('/api/v1/admin', require('./routes/admin').router);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'Nayapankh API' }));

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

const PORT = process.env.PORT || 3001;

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🔧 Nayapankh Backend → http://localhost:${PORT}`);
    console.log(`   Volunteers API → /api/v1/volunteers`);
    console.log(`   Admin API      → /api/v1/admin`);
    console.log(`   Health check   → /health\n`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
