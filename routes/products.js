import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Product from '../models/Product.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Image upload setup ───────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '../../public/images/products');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  },
});

// ── GET all products ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category, search, inStock } = req.query;
    const filter = {};
    if (category && category !== 'all') filter.category = { $in: [category] };
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (inStock !== undefined) filter.inStock = inStock === 'true';

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET single product ───────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST create product ──────────────────────────────────────────────────────
router.post('/', upload.array('images', 10), async (req, res) => {
  try {
    const body = req.body;
    const uploadedImages = req.files?.map(f => `/images/products/${f.filename}`) || [];

    const product = new Product({
      name:          body.name,
      category:      JSON.parse(body.category || '[]'),
      price:         parseFloat(body.price),
      originalPrice: body.originalPrice ? parseFloat(body.originalPrice) : null,
      image:         uploadedImages[0] || body.image || '',
      images:        uploadedImages.length > 0 ? uploadedImages : JSON.parse(body.images || '[]'),
      isNew:         body.isNew === 'true',
      isSale:        body.isSale === 'true',
      inStock:       body.inStock !== 'false',
      rating:        parseFloat(body.rating) || 5,
      reviews:       parseInt(body.reviews) || 0,
      sizes:         JSON.parse(body.sizes || '[]'),
      colors:        JSON.parse(body.colors || '[]'),
      description:   body.description || '',
      tags:          JSON.parse(body.tags || '[]'),
    });

    await product.save();
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── PUT update product ───────────────────────────────────────────────────────
router.put('/:id', upload.array('images', 10), async (req, res) => {
  try {
    const body = req.body;
    const uploadedImages = req.files?.map(f => `/images/products/${f.filename}`) || [];

    const updates = {
      name:          body.name,
      category:      JSON.parse(body.category || '[]'),
      price:         parseFloat(body.price),
      originalPrice: body.originalPrice ? parseFloat(body.originalPrice) : null,
      isNew:         body.isNew === 'true',
      isSale:        body.isSale === 'true',
      inStock:       body.inStock !== 'false',
      rating:        parseFloat(body.rating) || 5,
      reviews:       parseInt(body.reviews) || 0,
      sizes:         JSON.parse(body.sizes || '[]'),
      colors:        JSON.parse(body.colors || '[]'),
      description:   body.description || '',
      tags:          JSON.parse(body.tags || '[]'),
    };

    if (uploadedImages.length > 0) {
      updates.image = uploadedImages[0];
      updates.images = uploadedImages;
    } else if (body.image) {
      updates.image = body.image;
      updates.images = JSON.parse(body.images || `["${body.image}"]`);
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── DELETE product ───────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
