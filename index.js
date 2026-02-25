import dotenv from 'dotenv';
import { dirname as _dirname, join as _join } from 'path';
import { fileURLToPath as _ftu } from 'url';
dotenv.config({ path: _join(_dirname(_ftu(import.meta.url)), '.env') });
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

import adminAuthRoutes from './routes/auth.js';
import productRoutes   from './routes/products.js';
import analyticsRoutes from './routes/analytics.js';
import cartRoutes      from './routes/cart.js';
import orderRoutes     from './routes/orders.js';
import { requireAdmin } from './middleware/adminAuth.js';
import Activity from './models/Activity.js';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  /^http:\/\/localhost(:\d+)?$/,
  'https://vibewearr.netlify.app',
  'https://vibewears.netlify.app',
  'https://vibewear-admin.onrender.com',
  process.env.FRONTEND_URL,
].filter(Boolean);
app.use(cors({ origin: allowedOrigins }));

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/images', express.static(path.join(__dirname, '../public/images')));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/admin', adminAuthRoutes);

app.use('/api/products', (req, res, next) => {
  if (req.method === 'GET') return next();
  requireAdmin(req, res, next);
}, productRoutes);

// PUBLIC — store calls this for every visitor (no auth needed)
app.post('/api/analytics/track', async (req, res) => {
  try {
    const { uid, email, name } = req.body;
    if (!uid) return res.status(400).json({ success: false, message: 'uid required' });
    const today = new Date().toISOString().slice(0, 10);
    await Activity.findOneAndUpdate(
      { uid, date: today },
      { uid, email: email || '', name: name || (uid.startsWith('guest_') ? 'Guest' : ''), date: today },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PROTECTED — admin dashboard only
app.use('/api/analytics', requireAdmin, analyticsRoutes);

app.use('/api/cart',   cartRoutes);
app.use('/api/orders', orderRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// ── MongoDB ───────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
