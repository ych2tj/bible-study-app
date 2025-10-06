import express from 'express';
import { verifyPassword } from '../middleware/auth.js';

const router = express.Router();

// Login endpoint
router.post('/login', verifyPassword, (req, res) => {
  res.json({ success: true, message: 'Authentication successful' });
});

export default router;
