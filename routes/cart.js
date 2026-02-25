import express from 'express';
import Cart from '../models/Cart.js';

const router = express.Router();

// GET /api/cart/:uid — load saved cart
router.get('/:uid', async (req, res) => {
  try {
    const cart = await Cart.findOne({ uid: req.params.uid });
    res.json({ success: true, items: cart?.items || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/cart/:uid — save cart
router.post('/:uid', async (req, res) => {
  try {
    const { items } = req.body;
    const cart = await Cart.findOneAndUpdate(
      { uid: req.params.uid },
      { uid: req.params.uid, items },
      { upsert: true, new: true }
    );
    res.json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/cart/:uid — clear saved cart
router.delete('/:uid', async (req, res) => {
  try {
    await Cart.findOneAndUpdate({ uid: req.params.uid }, { items: [] });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
