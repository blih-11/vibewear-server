import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

// ── POST /api/admin/login ────────────────────────────────────────────────────
// Compares submitted credentials against .env values and returns a JWT
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const correctUsername = process.env.ADMIN_USERNAME;
    const correctPassword = process.env.ADMIN_PASSWORD;

    if (!correctUsername || !correctPassword) {
      return res.status(500).json({ success: false, message: 'Admin credentials not configured on server.' });
    }

    // Username check (case-insensitive)
    if (username.trim().toLowerCase() !== correctUsername.toLowerCase()) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    // Password check — supports both plain text (dev) and bcrypt hash (prod)
    let passwordValid = false;
    if (correctPassword.startsWith('$2')) {
      // It's a bcrypt hash
      passwordValid = await bcrypt.compare(password, correctPassword);
    } else {
      // Plain text comparison (fine for local dev)
      passwordValid = password === correctPassword;
    }

    if (!passwordValid) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    // Sign a JWT valid for 12 hours
    const token = jwt.sign(
      { role: 'admin', username: correctUsername },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({ success: true, token });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
});

// ── POST /api/admin/verify ───────────────────────────────────────────────────
// Frontend calls this to check if a stored token is still valid
router.post('/verify', (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ success: false, message: 'No token provided.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ success: true, admin: decoded });
  } catch {
    res.status(401).json({ success: false, message: 'Token expired or invalid.' });
  }
});

export default router;
