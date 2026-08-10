import express from 'express';
import Order from '../models/Order.js';
import { requireAdmin } from '../middleware/adminAuth.js';

const router = express.Router();

// Short, human-friendly order number customers can copy into a WhatsApp/IG message.
// Not cryptographically unique, but collision odds are negligible for this volume,
// and the schema's unique index will reject a true collision on save.
function generateOrderNumber() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid copy-paste confusion
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `VW-${code}`;
}

// ── POST /api/orders — create a new order (public) ─────────────────────────────
router.post('/', async (req, res) => {
  try {
    let orderNumber = generateOrderNumber();
    let order;
    // retry a couple times on the rare chance of a collision
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        order = await new Order({ ...req.body, orderNumber }).save();
        break;
      } catch (err) {
        if (err.code === 11000 && attempt < 2) { orderNumber = generateOrderNumber(); continue; }
        throw err;
      }
    }
    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── GET /api/orders/lookup/:orderNumber — admin looks up one order ─────────────
// Registered before the /:uid route below so it isn't swallowed by it.
router.get('/lookup/:orderNumber', requireAdmin, async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber.trim().toUpperCase() });
    if (!order) return res.status(404).json({ success: false, message: 'No order found with that ID' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/orders/recent — admin list of recent orders ───────────────────────
router.get('/recent', requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const orders = await Order.find().sort({ createdAt: -1 }).limit(limit);
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/orders/:id — admin updates order status (confirm/cancel/reopen) ───
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── GET /api/orders/:uid — get all orders for a user (public — customer's own) ─
router.get('/:uid', async (req, res) => {
  try {
    const orders = await Order.find({ uid: req.params.uid }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
