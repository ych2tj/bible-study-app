// Simple password authentication middleware
const AUTH_PASSWORD = process.env.AUTH_PASSWORD;

export function verifyPassword(req, res, next) {
  const { password } = req.body;

  if (password === AUTH_PASSWORD) {
    return next();
  }

  res.status(401).json({ error: 'Invalid password' });
}

export function checkAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || authHeader !== `Bearer ${AUTH_PASSWORD}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}
