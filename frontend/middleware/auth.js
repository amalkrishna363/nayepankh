function requireAdmin(req, res, next) {
  if (req.session && req.session.adminId) return next();
  // Accept short admin cookie set after login (helps when session cookie isn't present)
  const cookies = req.headers && req.headers.cookie ? req.headers.cookie : '';
  if (cookies.includes('nayapankh_admin=1')) return next();
  res.redirect('/admin/login');
}

module.exports = { requireAdmin };
