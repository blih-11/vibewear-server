import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { requireAdmin } from '../middleware/adminAuth.js';
import { requireOwnUid } from '../middleware/verifyFirebaseToken.js';
import { getUsdToGhsRate } from '../utils/exchangeRate.js';

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

// Shipping matches the calculation in Checkout.jsx exactly — kept in sync
// manually since there's no shared package between frontend/backend. If you
// ever change the rate/threshold on the frontend, update it here too.
const SHIPPING_RATE_PER_KG = 5;
const FREE_SHIPPING_THRESHOLD = 200;
const DEFAULT_ITEM_WEIGHT_KG = 0.3;

// Re-derives subtotal/shipping/total (and each item's price) from the real
// Product records rather than trusting whatever the browser sent. Without
// this, editing the request body in dev tools before checkout would let
// someone pay a fraction of the real cart value — the Paystack verify step
// only checks the paid amount against this order's stored total, so if the
// total itself were forged, a forged payment would "match" it perfectly.
async function priceOrderItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new Error('Your cart is empty.');
  }

  const productIds = rawItems.map(i => i.productId).filter(Boolean);
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map(p => [String(p._id), p]));

  let subtotal = 0;
  let totalWeightKg = 0;

  const items = rawItems.map(raw => {
    const product = productMap.get(String(raw.productId));
    if (!product) throw new Error(`One of the items in your cart is no longer available.`);

    const quantity = Math.max(1, Math.floor(Number(raw.quantity) || 0));
    if (!quantity) throw new Error(`Invalid quantity for "${product.name}".`);

    const price = product.price; // authoritative — never trust the client's price
    const weight = Number(product.weight) > 0 ? Number(product.weight) : DEFAULT_ITEM_WEIGHT_KG;

    subtotal += price * quantity;
    totalWeightKg += weight * quantity;

    return {
      productId: String(product._id),
      name: product.name,
      image: product.image,
      price,
      size: raw.size || '',
      color: raw.color || '',
      quantity,
    };
  });

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD
    ? 0
    : Math.round(totalWeightKg * SHIPPING_RATE_PER_KG * 100) / 100;

  return { items, subtotal, shipping, total: subtotal + shipping };
}

// ── POST /api/orders — create a new order (public) ─────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { items, subtotal, shipping, total } = await priceOrderItems(req.body.items);
    const fxRateGHS = await getUsdToGhsRate();
    const totalGHS = Math.round(total * fxRateGHS * 100) / 100;

    let orderNumber = generateOrderNumber();
    let order;
    // retry a couple times on the rare chance of a collision
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        order = await new Order({
          ...req.body,
          items, subtotal, shipping, total, totalGHS, fxRateGHS, // server-computed values win, always
          orderNumber,
        }).save();
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

// ── GET /api/orders/:uid — get all orders for a user ───────────────────────────
// Requires a valid Firebase ID token that actually belongs to :uid — otherwise
// anyone who knew (or guessed) a customer's uid could pull their full order
// history, including name/phone/address.
router.get('/:uid', requireOwnUid, async (req, res) => {
  try {
    const orders = await Order.find({ uid: req.params.uid }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;