// Simple username and password authentication middleware
// Use getter functions to always get the current values from process.env
const getAuthUsername = () => process.env.AUTH_USERNAME;
const getAuthPassword = () => process.env.AUTH_PASSWORD;

export function verifyCredentials(req, res, next) {
  const { username, password } = req.body;

  if (username === getAuthUsername() && password === getAuthPassword()) {
    return next();
  }

  res.status(401).json({ error: 'Invalid username or password' });
}

export function checkAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || authHeader !== `Bearer ${getAuthPassword()}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}
