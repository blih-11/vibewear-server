import jwt from 'jsonwebtoken';

// Middleware to protect routes that require admin JWT
export function requireAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'No admin token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Admin token expired or invalid. Please log in again.' });
  }
}
