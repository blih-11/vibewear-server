import express from 'express';
import InstagramPost from '../models/InstagramPost.js';

const router = express.Router();

// Accepts instagram.com/p/..., /reel/..., /tv/... post/reel URLs (with or without www, trailing slash, query string)
const IG_URL_RE = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?/;

// ── GET active posts (public — storefront calls this) ─────────────────────────
router.get('/', async (req, res) => {
  try {
    const posts = await InstagramPost.find({ active: true }).sort({ order: 1, createdAt: -1 });
    res.json({ success: true, posts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST create (admin) ────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { url, order } = req.body;
    if (!url || !IG_URL_RE.test(url.trim())) {
      return res.status(400).json({ success: false, message: 'Please paste a valid Instagram post URL (instagram.com/p/... or /reel/...)' });
    }
    const post = new InstagramPost({ url: url.trim(), order: Number(order) || 0 });
    await post.save();
    res.status(201).json({ success: true, post });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── PUT update (admin) — reorder or toggle active ──────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { url, order, active } = req.body;
    const updates = {};
    if (url !== undefined) {
      if (!IG_URL_RE.test(url.trim())) {
        return res.status(400).json({ success: false, message: 'Please paste a valid Instagram post URL' });
      }
      updates.url = url.trim();
    }
    if (order !== undefined) updates.order = Number(order) || 0;
    if (active !== undefined) updates.active = !!active;

    const post = await InstagramPost.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, post });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── DELETE (admin) ──────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const post = await InstagramPost.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
