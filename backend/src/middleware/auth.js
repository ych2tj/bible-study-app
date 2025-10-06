// Simple password authentication middleware
// Use a getter function to always get the current password from process.env
const getAuthPassword = () => process.env.AUTH_PASSWORD;

export function verifyPassword(req, res, next) {
  const { password } = req.body;

  if (password === getAuthPassword()) {
    return next();
  }

  res.status(401).json({ error: 'Invalid password' });
}

export function checkAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || authHeader !== `Bearer ${getAuthPassword()}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}
