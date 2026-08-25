import express from 'express';
import Category from '../models/Category.js';

const router = express.Router();

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ── GET all categories (optionally filter by ?type=category|section) ─────────
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    const filter = type ? { type } : {};
    const categories = await Category.find(filter).sort({ type: 1, name: 1 });
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST create a new category or section ────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { name, type } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: 'Name is required' });

    const resolvedType = type === 'section' ? 'section' : 'category';
    let slug = slugify(name);
    if (!slug) return res.status(400).json({ success: false, message: 'Invalid name' });

    // Ensure slug uniqueness — append -2, -3, etc. on collision
    let candidate = slug;
    let n = 2;
    while (await Category.findOne({ slug: candidate })) {
      candidate = `${slug}-${n++}`;
    }

    const category = await Category.create({ name: name.trim(), slug: candidate, type: resolvedType });
    res.status(201).json({ success: true, category });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── DELETE a category or section ──────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Idempotent default seed — called once at server boot. Upserts each default
// individually (rather than skipping entirely if the collection isn't empty) so
// re-deploying after adding new defaults here still fills in the new ones without
// duplicating or touching anything an admin has already created/edited. ──
export async function seedDefaultCategories() {
  const defaults = [
    { name: 'Tees',              slug: 'tees',               type: 'category' },
    { name: 'Shirts',            slug: 'shirts',              type: 'category' },
    { name: 'Hoodies',           slug: 'hoodies',             type: 'category' },
    { name: 'Bottoms',           slug: 'bottoms',              type: 'category' },
    { name: 'Accessories',       slug: 'accessories',          type: 'category' },
    { name: 'Full Fits',         slug: 'fullfit',              type: 'category' },
    { name: 'New Arrivals',      slug: 'new-arrivals',        type: 'section' },
    { name: 'Sales',             slug: 'sales',                type: 'section' },
    { name: 'Top Products',      slug: 'top-products',        type: 'section' },
  ];

  let seeded = 0;
  for (const def of defaults) {
    const exists = await Category.findOne({ slug: def.slug });
    if (!exists) { await Category.create(def); seeded++; }
  }
  if (seeded > 0) console.log(`🌱 Seeded ${seeded} new default categories/sections`);

  // Retired sections — "Latest" and "Featured Editorial" no longer exist on the
  // homepage (Latest was replaced by "Sales"; Featured Editorial was removed
  // outright along with its video banner). Clean these up so they don't linger
  // as dead options in the admin's Sections picker. Any product previously
  // tagged with these keeps the tag (harmless, just unused) — only the
  // selectable Category entries themselves are removed.
  const retired = await Category.deleteMany({ slug: { $in: ['latest', 'featured-editorial'] } });
  if (retired.deletedCount > 0) console.log(`🧹 Removed ${retired.deletedCount} retired section(s)`);
}

export default router;