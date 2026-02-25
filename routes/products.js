import express from 'express';
import multer from 'multer';
import cloudinary from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import Product from '../models/Product.js';

const router = express.Router();

// ── Cloudinary config ────────────────────────────────────────────────────────
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder:          'vibewear/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation:  [{ width: 1200, crop: 'limit', quality: 'auto' }],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
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
    const uploadedImages = req.files?.map(f => f.path) || [];

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
    const uploadedImages = req.files?.map(f => f.path) || [];

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
      updates.image  = uploadedImages[0];
      updates.images = uploadedImages;
    } else if (body.image) {
      updates.image  = body.image;
      updates.images = JSON.parse(body.images || '["' + body.image + '"]');
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
