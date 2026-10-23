import express from 'express';
import multer from 'multer';
import cloudinary from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import Fit from '../models/Fit.js';

const router = express.Router();

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder:          'vibewear/fits',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation:  [{ width: 1200, crop: 'limit', quality: 'auto' }],
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  },
});

function parseItems(raw) {
  try {
    const arr = JSON.parse(raw || '[]');
    return Array.isArray(arr) ? [...new Set(arr.map(String))] : [];
  } catch {
    return [];
  }
}

// ── GET fits — items populated with live Product data so the storefront has
// price/sizes/stock without extra requests. Store only sees active fits;
// the admin dashboard passes ?all=true to also see hidden ones. ──────────────
router.get('/', async (req, res) => {
  try {
    const filter = req.query.all === 'true' ? {} : { active: true };
    const fits = await Fit.find(filter).sort({ _id: -1 }).populate('items');
    // A product may have been deleted after being added to a fit — drop dangling refs
    const cleaned = fits.map(f => {
      const obj = f.toObject();
      obj.items = (obj.items || []).filter(Boolean);
      return obj;
    });
    res.json({ success: true, fits: cleaned });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST create fit ──────────────────────────────────────────────────────────
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const items = parseItems(req.body.items);
    if (items.length < 2) return res.status(400).json({ success: false, message: 'Pick at least 2 products for a fit.' });
    const image = req.file?.path || req.body.image || '';
    if (!image) return res.status(400).json({ success: false, message: 'A fit image is required.' });

    const fit = await Fit.create({
      name:   req.body.name,
      image,
      items,
      active: req.body.active !== 'false',
    });
    res.status(201).json({ success: true, fit });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── PUT update fit ───────────────────────────────────────────────────────────
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const updates = {};
    if (req.body.name !== undefined)   updates.name = req.body.name;
    if (req.body.active !== undefined) updates.active = req.body.active !== 'false';
    if (req.body.items !== undefined) {
      const items = parseItems(req.body.items);
      if (items.length < 2) return res.status(400).json({ success: false, message: 'Pick at least 2 products for a fit.' });
      updates.items = items;
    }
    if (req.file?.path) updates.image = req.file.path;

    const fit = await Fit.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!fit) return res.status(404).json({ success: false, message: 'Fit not found' });
    res.json({ success: true, fit });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── DELETE fit ───────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const fit = await Fit.findByIdAndDelete(req.params.id);
    if (!fit) return res.status(404).json({ success: false, message: 'Fit not found' });
    res.json({ success: true, message: 'Fit deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
