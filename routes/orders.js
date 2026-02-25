import express from 'express';
import Order from '../models/Order.js';

const router = express.Router();

// POST /api/orders — create a new order
router.post('/', async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/orders/:uid — get all orders for a user
router.get('/:uid', async (req, res) => {
  try {
    const orders = await Order.find({ uid: req.params.uid }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
