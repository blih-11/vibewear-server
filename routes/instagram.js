import express from 'express';
import InstagramPost from '../models/InstagramPost.js';

const router = express.Router();

// Accepts instagram.com/p/..., /reel/..., /tv/... post/reel URLs (with or without www, trailing slash, query string)
const IG_URL_RE = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?/;

// ── GET posts. Public callers (storefront) only ever see active ones; the admin
// panel passes ?all=true to see everything, including hidden posts, so a post
// that's been toggled off doesn't just vanish with no way to bring it back. ──
router.get('/', async (req, res) => {
  try {
    const filter = req.query.all === 'true' ? {} : { active: true };
    const posts = await InstagramPost.find(filter).sort({ order: 1, createdAt: -1 });
    res.json({ success: true, posts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST create (admin) ────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || !IG_URL_RE.test(url.trim())) {
      return res.status(400).json({ success: false, message: 'Please paste a valid Instagram post URL (instagram.com/p/... or /reel/...)' });
    }
    // New posts always land first — the server (not the client) decides this so
    // it can't be thrown off by a stale post count: find the current lowest
    // `order` and go one below it, rather than trusting a client-supplied value.
    const lowest = await InstagramPost.findOne().sort({ order: 1 });
    const newOrder = lowest ? lowest.order - 1 : 0;

    const post = new InstagramPost({ url: url.trim(), order: newOrder });
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