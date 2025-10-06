import express from 'express';
import { verifyPassword, checkAuth } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Login endpoint
router.post('/login', verifyPassword, (req, res) => {
  res.json({ success: true, message: 'Authentication successful' });
});

// Change password endpoint
router.post('/change-password', checkAuth, (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword || newPassword.trim().length === 0) {
    return res.status(400).json({ error: 'New password is required' });
  }

  try {
    // Find .env file in project root (3 levels up from this file)
    const envPath = path.resolve(__dirname, '../../../.env');

    // Read current .env file
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Update or add AUTH_PASSWORD
    const lines = envContent.split('\n');
    let passwordUpdated = false;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('AUTH_PASSWORD=')) {
        lines[i] = `AUTH_PASSWORD=${newPassword}`;
        passwordUpdated = true;
        break;
      }
    }

    if (!passwordUpdated) {
      lines.push(`AUTH_PASSWORD=${newPassword}`);
    }

    // Write back to .env file
    fs.writeFileSync(envPath, lines.join('\n'));

    // Update environment variable for current process
    process.env.AUTH_PASSWORD = newPassword;

    res.json({
      success: true,
      message: 'Password changed successfully. The new password is now active.'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;
