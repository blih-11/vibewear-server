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
import cartRoutes    from './routes/cart.js';
import orderRoutes   from './routes/orders.js';
import { requireAdmin } from './middleware/adminAuth.js';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;

// ── CORS ──────────────────────────────────────────────────────────────────────
// Allows any localhost port in dev + your deployed frontend URL in prod
const allowedOrigins = [
  /^http:\/\/localhost(:\d+)?$/,          // any localhost port (dev)
  'https://vibewearr.netlify.app',        // store
  'https://vibewear-admin.onrender.com',  // admin panel
  process.env.FRONTEND_URL,              // optional override via env var
].filter(Boolean);
app.use(cors({ origin: allowedOrigins }));

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve product images statically (public — no auth needed)
app.use('/images', express.static(path.join(__dirname, '../public/images')));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/admin', adminAuthRoutes);

app.use('/api/products', (req, res, next) => {
  if (req.method === 'GET') return next();
  requireAdmin(req, res, next);
}, productRoutes);

app.use('/api/analytics', requireAdmin, analyticsRoutes);

app.use('/api/cart',   cartRoutes);
app.use('/api/orders', orderRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// ── MongoDB Connection ────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
