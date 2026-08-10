/**
 * SETUP SCRIPT — Run AFTER rename-new-images.js
 *
 * This script:
 * 1. Uploads ALL product images (img_1 → img_109) to Cloudinary
 * 2. Clears existing products from MongoDB
 * 3. Re-seeds the full catalogue with permanent Cloudinary URLs
 *
 * Usage:
 *   node seed-cloudinary.js /path/to/VIbe/public/images/products
 *
 * Example:
 *   node seed-cloudinary.js ../VIbe/public/images/products
 *
 * Prerequisites:
 *   .env must contain: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY,
 *                      CLOUDINARY_API_SECRET, MONGO_URI
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import cloudinary from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from './models/Product.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Cloudinary config ─────────────────────────────────────────────────────────
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Image folder (pass as CLI arg or default to sibling store folder) ─────────
const imgDir = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(__dirname, '../VIbe/public/images/products');

if (!fs.existsSync(imgDir)) {
  console.error(`❌ Image folder not found: ${imgDir}`);
  console.error('   Usage: node seed-cloudinary.js /path/to/VIbe/public/images/products');
  process.exit(1);
}

// ── Upload all images and build a map { img_1 -> cloudinary_url } ────────────
async function uploadImages() {
  const files = fs.readdirSync(imgDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
  console.log(`📸 Found ${files.length} images. Uploading to Cloudinary...`);

  const map = {};
  for (const file of files) {
    const key = path.basename(file, path.extname(file)); // e.g. "img_1"
    const filePath = path.join(imgDir, file);
    try {
      const result = await cloudinary.v2.uploader.upload(filePath, {
        folder:         'vibewear/products',
        public_id:      key,
        overwrite:      true,
        transformation: [{ width: 1200, crop: 'limit', quality: 'auto' }],
      });
      map[key] = result.secure_url;
      console.log(`  ✅ ${file} → ${result.secure_url}`);
    } catch (err) {
      console.error(`  ❌ Failed to upload ${file}:`, err.message);
    }
  }
  return map;
}

// ── Helper: replace local path with Cloudinary URL ───────────────────────────
function resolveUrl(localPath, map) {
  const key = path.basename(localPath, path.extname(localPath));
  return map[key] || localPath;
}

// ── Full product catalogue ────────────────────────────────────────────────────
function buildProducts(map) {
  const r = (p) => resolveUrl(p, map);
  return [
    // ── FITS ──────────────────────────────────────────────────────────────────
    { name: 'Wave Fit Vol.1',  category: ['fits'], price: 179.99, image: r('/images/products/img_1.jpg'),  images: [r('/images/products/img_1.jpg'),  r('/images/products/img_2.jpg')],  isNew: true,  isSale: false, inStock: true, rating: 5, reviews: 0,  sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black','White'], description: 'Full outfit bundle. WE THE WAVE.', tags: ['fits'] },
    { name: 'Wave Fit Vol.2',  category: ['fits'], price: 169.99, image: r('/images/products/img_3.jpg'),  images: [r('/images/products/img_3.jpg'),  r('/images/products/img_4.jpg')],  isNew: true,  isSale: false, inStock: true, rating: 5, reviews: 0,  sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black','White'], description: 'Full outfit bundle. WE THE WAVE.', tags: ['fits'] },
    { name: 'Wave Fit Vol.3',  category: ['fits'], price: 159.99, image: r('/images/products/img_5.jpg'),  images: [r('/images/products/img_5.jpg'),  r('/images/products/img_6.jpg')],  isNew: false, isSale: false, inStock: true, rating: 5, reviews: 0,  sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black','White'], description: 'Full outfit bundle. WE THE WAVE.', tags: ['fits'] },
    { name: 'Wave Fit Vol.4',  category: ['fits'], price: 164.99, image: r('/images/products/img_7.jpg'),  images: [r('/images/products/img_7.jpg'),  r('/images/products/img_8.jpg')],  isNew: false, isSale: false, inStock: true, rating: 5, reviews: 0,  sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black','White'], description: 'Full outfit bundle. WE THE WAVE.', tags: ['fits'] },
    { name: 'Wave Fit Vol.5',  category: ['fits'], price: 154.99, image: r('/images/products/img_9.jpg'),  images: [r('/images/products/img_9.jpg'),  r('/images/products/img_10.jpg')], isNew: false, isSale: false, inStock: true, rating: 5, reviews: 0,  sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black','White'], description: 'Full outfit bundle. WE THE WAVE.', tags: ['fits'] },
    { name: 'Wave Fit Vol.6',  category: ['fits'], price: 174.99, image: r('/images/products/img_11.jpg'), images: [r('/images/products/img_11.jpg'), r('/images/products/img_12.jpg')], isNew: false, isSale: false, inStock: true, rating: 5, reviews: 0,  sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black','White'], description: 'Full outfit bundle. WE THE WAVE.', tags: ['fits'] },
    { name: 'Wave Fit Vol.7',  category: ['fits'], price: 184.99, image: r('/images/products/img_20.jpg'), images: [r('/images/products/img_20.jpg'), r('/images/products/img_21.jpg')], isNew: true,  isSale: false, inStock: true, rating: 5, reviews: 0,  sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black','White'], description: 'Full outfit bundle. WE THE WAVE.', tags: ['fits'] },
    { name: 'Wave Fit Vol.8',  category: ['fits'], price: 189.99, image: r('/images/products/img_22.jpg'), images: [r('/images/products/img_22.jpg'), r('/images/products/img_23.jpg')], isNew: true,  isSale: false, inStock: true, rating: 5, reviews: 0,  sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black','White'], description: 'Full outfit bundle. WE THE WAVE.', tags: ['fits'] },
    { name: 'Wave Fit Vol.9',  category: ['fits'], price: 194.99, image: r('/images/products/img_24.jpg'), images: [r('/images/products/img_24.jpg'), r('/images/products/img_25.jpg'), r('/images/products/img_26.jpg'), r('/images/products/img_27.jpg')], isNew: true, isSale: false, inStock: true, rating: 5, reviews: 0, sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black','White'], description: 'Full outfit bundle. WE THE WAVE.', tags: ['fits'] },
    { name: 'Wave Fit Vol.10', category: ['fits'], price: 199.99, image: r('/images/products/img_65.jpg'), images: [r('/images/products/img_65.jpg')], isNew: true, isSale: false, inStock: true, rating: 5, reviews: 0, sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black','White'], description: 'Latest drop bundle. WE THE WAVE.', tags: ['fits'] },

    // ── TOPS — GRAPHIC TEES ───────────────────────────────────────────────────
    { name: 'Vibe Wear Graphic Tee #1',  category: ['tops'], price: 49.99, image: r('/images/products/img_13.jpg'), images: [r('/images/products/img_13.jpg')], isNew: true,  isSale: false, inStock: true, rating: 4.8, reviews: 12, sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black','White'], description: 'Heavy 240gsm cotton graphic tee. WE THE WAVE.', tags: ['tops','tee'] },
    { name: 'Vibe Wear Graphic Tee #2',  category: ['tops'], price: 49.99, image: r('/images/products/img_14.jpg'), images: [r('/images/products/img_14.jpg')], isNew: true,  isSale: false, inStock: true, rating: 4.9, reviews: 8,  sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black','White'], description: 'Heavy 240gsm cotton graphic tee. WE THE WAVE.', tags: ['tops','tee'] },
    { name: 'Vibe Wear Graphic Tee #3',  category: ['tops'], price: 49.99, image: r('/images/products/img_15.jpg'), images: [r('/images/products/img_15.jpg')], isNew: false, isSale: false, inStock: true, rating: 4.7, reviews: 5,  sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black','White'], description: 'Oversized boxy tee. Street premium.', tags: ['tops','tee'] },
    { name: 'Vibe Wear Graphic Tee #4',  category: ['tops'], price: 54.99, image: r('/images/products/img_16.jpg'), images: [r('/images/products/img_16.jpg')], isNew: false, isSale: true, originalPrice: 69.99, inStock: true, rating: 4.8, reviews: 20, sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black','White'], description: 'Oversized boxy tee. Street premium.', tags: ['tops','tee'] },
    { name: 'Vibe Wear Tee #5',          category: ['tops'], price: 44.99, image: r('/images/products/img_58.jpg'), images: [r('/images/products/img_58.jpg')], isNew: false, isSale: false, inStock: true, rating: 4.6, reviews: 4,  sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black','White'], description: 'Graphic tee. WE THE WAVE.', tags: ['tops','tee'] },
    { name: 'Vibe Wear Tee #6',          category: ['tops'], price: 44.99, image: r('/images/products/img_59.jpg'), images: [r('/images/products/img_59.jpg')], isNew: false, isSale: false, inStock: true, rating: 4.7, reviews: 6,  sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black','White'], description: 'Graphic tee. WE THE WAVE.', tags: ['tops','tee'] },
    { name: 'Vibe Wear Tee #7',          category: ['tops'], price: 49.99, image: r('/images/products/img_60.jpg'), images: [r('/images/products/img_60.jpg')], isNew: true,  isSale: false, inStock: true, rating: 4.8, reviews: 11, sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black','White'], description: 'Premium graphic tee. WE THE WAVE.', tags: ['tops','tee'] },
    { name: 'Vibe Wear Tee #8',          category: ['tops'], price: 49.99, image: r('/images/products/img_61.jpg'), images: [r('/images/products/img_61.jpg')], isNew: false, isSale: true, originalPrice: 64.99, inStock: true, rating: 4.6, reviews: 8, sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black','White'], description: 'Premium graphic tee. WE THE WAVE.', tags: ['tops','tee'] },
    { name: 'Vibe Wear Tee #9',          category: ['tops'], price: 54.99, image: r('/images/products/img_62.jpg'), images: [r('/images/products/img_62.jpg')], isNew: true,  isSale: false, inStock: true, rating: 4.9, reviews: 16, sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black'], description: 'Premium heavyweight tee. WE THE WAVE.', tags: ['tops','tee'] },
    { name: 'Vibe Wear Tee #10',         category: ['tops'], price: 54.99, image: r('/images/products/img_63.jpg'), images: [r('/images/products/img_63.jpg')], isNew: false, isSale: false, inStock: true, rating: 4.7, reviews: 7,  sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black'], description: 'Premium heavyweight tee. WE THE WAVE.', tags: ['tops','tee'] },
    { name: 'Vibe Wear Tee #11',         category: ['tops'], price: 44.99, image: r('/images/products/img_64.jpg'), images: [r('/images/products/img_64.jpg')], isNew: false, isSale: false, inStock: true, rating: 4.5, reviews: 3,  sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black','White'], description: 'Graphic tee. WE THE WAVE.', tags: ['tops','tee'] },

    // ── TOPS — HOODIES ────────────────────────────────────────────────────────
    { name: 'Vibe Wear Hoodie #1', category: ['tops','outerwear'], price: 89.99, image: r('/images/products/img_37.jpg'), images: [r('/images/products/img_37.jpg'), r('/images/products/img_38.jpg')], isNew: true,  isSale: false, inStock: true, rating: 4.9, reviews: 15, sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black'], description: 'Heavy fleece zip hoodie. WE THE WAVE.', tags: ['tops','hoodie'] },
    { name: 'Vibe Wear Hoodie #2', category: ['tops','outerwear'], price: 84.99, image: r('/images/products/img_39.jpg'), images: [r('/images/products/img_39.jpg'), r('/images/products/img_40.jpg')], isNew: false, isSale: false, inStock: true, rating: 4.8, reviews: 10, sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black','White'], description: 'Heavy fleece zip hoodie. WE THE WAVE.', tags: ['tops','hoodie'] },

    // ── TOPS — SHIRTS ─────────────────────────────────────────────────────────
    { name: 'Vibe Wear Shirt #1', category: ['tops'], price: 74.99, image: r('/images/products/img_41.jpg'), images: [r('/images/products/img_41.jpg')], isNew: true,  isSale: false, inStock: true, rating: 4.7, reviews: 6,  sizes: ['XS','S','M','L','XL','XXL'], colors: ['White','Black'], description: 'Oversized short-sleeve shirt. Street ready.', tags: ['tops','shirt'] },
    { name: 'Vibe Wear Shirt #2', category: ['tops'], price: 74.99, image: r('/images/products/img_42.jpg'), images: [r('/images/products/img_42.jpg'), r('/images/products/img_43.jpg')], isNew: false, isSale: true, originalPrice: 89.99, inStock: true, rating: 4.6, reviews: 9, sizes: ['XS','S','M','L','XL','XXL'], colors: ['White','Black'], description: 'Oversized short-sleeve shirt. Street ready.', tags: ['tops','shirt'] },
    { name: 'Vibe Wear Shirt #3', category: ['tops'], price: 79.99, image: r('/images/products/img_44.jpg'), images: [r('/images/products/img_44.jpg')], isNew: true,  isSale: false, inStock: true, rating: 4.8, reviews: 14, sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black'], description: 'Premium short-sleeve. WE THE WAVE.', tags: ['tops','shirt'] },
    { name: 'Vibe Wear Shirt #4', category: ['tops'], price: 79.99, image: r('/images/products/img_46.jpg'), images: [r('/images/products/img_46.jpg')], isNew: false, isSale: false, inStock: true, rating: 4.7, reviews: 7,  sizes: ['XS','S','M','L','XL','XXL'], colors: ['White'], description: 'Premium short-sleeve. WE THE WAVE.', tags: ['tops','shirt'] },
    { name: 'Vibe Wear Shirt #5', category: ['tops'], price: 79.99, image: r('/images/products/img_45.jpg'), images: [r('/images/products/img_45.jpg')], isNew: false, isSale: false, inStock: true, rating: 4.7, reviews: 9,  sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black','White'], description: 'Street shirt. WE THE WAVE.', tags: ['tops','shirt'] },

    // ── BOTTOMS — JEANS ───────────────────────────────────────────────────────
    { name: 'Vibe Wear Jeans #1', category: ['bottoms'], price: 99.99,  image: r('/images/products/img_28.jpg'), images: [r('/images/products/img_28.jpg')], isNew: true,  isSale: false, inStock: true, rating: 4.9, reviews: 18, sizes: ['28','30','32','34','36'], colors: ['Black','Indigo'], description: 'Street-cut denim. Built for movement.', tags: ['bottoms','jeans'] },
    { name: 'Vibe Wear Jeans #2', category: ['bottoms'], price: 99.99,  image: r('/images/products/img_29.jpg'), images: [r('/images/products/img_29.jpg')], isNew: false, isSale: false, inStock: true, rating: 4.8, reviews: 11, sizes: ['28','30','32','34','36'], colors: ['Black','Indigo'], description: 'Street-cut denim. Built for movement.', tags: ['bottoms','jeans'] },
    { name: 'Vibe Wear Jeans #3', category: ['bottoms'], price: 109.99, image: r('/images/products/img_30.jpg'), images: [r('/images/products/img_30.jpg')], isNew: true,  isSale: false, inStock: true, rating: 4.9, reviews: 22, sizes: ['28','30','32','34','36'], colors: ['Black'], description: 'Premium cargo jeans. WE THE WAVE.', tags: ['bottoms','jeans','cargo'] },
    { name: 'Vibe Wear Jeans #4', category: ['bottoms'], price: 109.99, image: r('/images/products/img_31.jpg'), images: [r('/images/products/img_31.jpg')], isNew: false, isSale: true, originalPrice: 129.99, inStock: true, rating: 4.7, reviews: 16, sizes: ['28','30','32','34','36'], colors: ['Black'], description: 'Premium cargo jeans. WE THE WAVE.', tags: ['bottoms','jeans','cargo'] },
    { name: 'Vibe Wear Jeans #5', category: ['bottoms'], price: 94.99,  image: r('/images/products/img_32.jpg'), images: [r('/images/products/img_32.jpg'), r('/images/products/img_33.jpg')], isNew: true, isSale: false, inStock: true, rating: 4.8, reviews: 9, sizes: ['28','30','32','34','36'], colors: ['Black','Blue'], description: 'Distressed straight-leg. Street premium.', tags: ['bottoms','jeans'] },

    // ── BOTTOMS — SHORTS ──────────────────────────────────────────────────────
    { name: 'Vibe Wear Shorts #1', category: ['bottoms'], price: 69.99, image: r('/images/products/img_34.jpg'), images: [r('/images/products/img_34.jpg')], isNew: true,  isSale: false, inStock: true, rating: 4.7, reviews: 13, sizes: ['S','M','L','XL','XXL'], colors: ['Black','White'], description: 'Cargo shorts. Ready for the streets.', tags: ['bottoms','shorts'] },
    { name: 'Vibe Wear Shorts #2', category: ['bottoms'], price: 74.99, image: r('/images/products/img_35.jpg'), images: [r('/images/products/img_35.jpg')], isNew: false, isSale: false, inStock: true, rating: 4.8, reviews: 8,  sizes: ['S','M','L','XL','XXL'], colors: ['Black'], description: 'Denim shorts. Street ready.', tags: ['bottoms','shorts'] },
    { name: 'Vibe Wear Shorts #3', category: ['bottoms'], price: 69.99, image: r('/images/products/img_36.jpg'), images: [r('/images/products/img_36.jpg')], isNew: false, isSale: true, originalPrice: 84.99, inStock: true, rating: 4.6, reviews: 5, sizes: ['S','M','L','XL','XXL'], colors: ['Black'], description: 'Tactical cargo shorts. WE THE WAVE.', tags: ['bottoms','shorts','cargo'] },

    // ── OUTERWEAR — JACKETS ───────────────────────────────────────────────────
    { name: 'Vibe Wear Jacket #1', category: ['outerwear'], price: 159.99, image: r('/images/products/img_47.jpg'), images: [r('/images/products/img_47.jpg'), r('/images/products/img_48.jpg')], isNew: true,  isSale: false, inStock: true, rating: 4.9, reviews: 7,  sizes: ['S','M','L','XL','XXL'], colors: ['Black'], description: 'Heavy washed jacket. Street outerwear. WE THE WAVE.', tags: ['outerwear','jacket'] },
    { name: 'Vibe Wear Jacket #2', category: ['outerwear'], price: 149.99, image: r('/images/products/img_49.jpg'), images: [r('/images/products/img_49.jpg'), r('/images/products/img_50.jpg')], isNew: false, isSale: false, inStock: true, rating: 4.8, reviews: 11, sizes: ['S','M','L','XL','XXL'], colors: ['Black','Grey'], description: 'Bomber jacket. Street outerwear. WE THE WAVE.', tags: ['outerwear','jacket','bomber'] },

    // ── OUTERWEAR — VESTS ─────────────────────────────────────────────────────
    { name: 'Vibe Wear Vest #1', category: ['outerwear'], price: 89.99, image: r('/images/products/img_51.jpg'), images: [r('/images/products/img_51.jpg')], isNew: true,  isSale: true, originalPrice: 119.99, inStock: true, rating: 4.7, reviews: 6,  sizes: ['S','M','L','XL','XXL'], colors: ['Black'], description: 'Puffer vest. Street outerwear.', tags: ['outerwear','vest'] },
    { name: 'Vibe Wear Vest #2', category: ['outerwear'], price: 89.99, image: r('/images/products/img_52.jpg'), images: [r('/images/products/img_52.jpg'), r('/images/products/img_53.jpg')], isNew: false, isSale: false, inStock: true, rating: 4.8, reviews: 14, sizes: ['S','M','L','XL','XXL'], colors: ['Black','White'], description: 'Reversible puffer vest. Street outerwear.', tags: ['outerwear','vest'] },

    // ── ACCESSORIES ───────────────────────────────────────────────────────────
    { name: 'Vibe Wear Cap #1',    category: ['accessories'], price: 29.99, image: r('/images/products/img_54.jpg'), images: [r('/images/products/img_54.jpg')], isNew: true,  isSale: false, inStock: true, rating: 4.9, reviews: 25, sizes: ['One Size'], colors: ['Black','White'], description: 'Street cap. VIBE WEAR branded.', tags: ['accessories','cap'] },
    { name: 'Vibe Wear Cap #2',    category: ['accessories'], price: 29.99, image: r('/images/products/img_55.jpg'), images: [r('/images/products/img_55.jpg')], isNew: false, isSale: false, inStock: true, rating: 4.8, reviews: 17, sizes: ['One Size'], colors: ['Black'], description: 'Street cap. VIBE WEAR branded.', tags: ['accessories','cap'] },
    { name: 'Vibe Wear Beanie #1', category: ['accessories'], price: 24.99, image: r('/images/products/img_56.jpg'), images: [r('/images/products/img_56.jpg')], isNew: true,  isSale: false, inStock: true, rating: 4.7, reviews: 10, sizes: ['One Size'], colors: ['Black','White'], description: 'Ribbed knit beanie. VIBE WEAR branded.', tags: ['accessories','beanie'] },
    { name: 'Vibe Wear Bucket Hat', category: ['accessories'], price: 32.99, image: r('/images/products/img_57.jpg'), images: [r('/images/products/img_57.jpg')], isNew: false, isSale: true, originalPrice: 44.99, inStock: true, rating: 4.8, reviews: 19, sizes: ['One Size'], colors: ['Black','White'], description: 'Wide brim bucket hat. VIBE WEAR branded.', tags: ['accessories','bucket'] },

    // ── NEW DROPS — img_66 through img_109 (44 new Instagram images) ──────────
    // Grouped in pairs where possible for multi-image galleries.
    // Edit names, prices, and categories to match your actual new products.
    { name: 'Vibe Drop Vol.1',  category: ['fits'], price: 189.99, image: r('/images/products/img_66.jpg'), images: [r('/images/products/img_66.jpg'), r('/images/products/img_67.jpg')], isNew: true, isSale: false, inStock: true, rating: 5, reviews: 0, sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black','White'], description: 'New drop. WE THE WAVE.', tags: ['fits'] },
    { name: 'Vibe Drop Vol.2',  category: ['fits'], price: 189.99, image: r('/images/products/img_68.jpg'), images: [r('/images/products/img_68.jpg'), r('/images/products/img_69.jpg')], isNew: true, isSale: false, inStock: true, rating: 5, reviews: 0, sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black','White'], description: 'New drop. WE THE WAVE.', tags: ['fits'] },
    { name: 'Vibe Drop Vol.3',  category: ['fits'], price: 194.99, image: r('/images/products/img_70.jpg'), images: [r('/images/products/img_70.jpg'), r('/images/products/img_71.jpg')], isNew: true, isSale: false, inStock: true, rating: 5, reviews: 0, sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black','White'], description: 'New drop. WE THE WAVE.', tags: ['fits'] },
    { name: 'Vibe Drop Vol.4',  category: ['fits'], price: 194.99, image: r('/images/products/img_72.jpg'), images: [r('/images/products/img_72.jpg'), r('/images/products/img_73.jpg')], isNew: true, isSale: false, inStock: true, rating: 5, reviews: 0, sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black','White'], description: 'New drop. WE THE WAVE.', tags: ['fits'] },
    { name: 'Vibe Drop Vol.5',  category: ['fits'], price: 199.99, image: r('/images/products/img_74.jpg'), images: [r('/images/products/img_74.jpg'), r('/images/products/img_75.jpg')], isNew: true, isSale: false, inStock: true, rating: 5, reviews: 0, sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black','White'], description: 'New drop. WE THE WAVE.', tags: ['fits'] },
    { name: 'Vibe Drop Vol.6',  category: ['fits'], price: 199.99, image: r('/images/products/img_76.jpg'), images: [r('/images/products/img_76.jpg'), r('/images/products/img_77.jpg')], isNew: true, isSale: false, inStock: true, rating: 5, reviews: 0, sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black','White'], description: 'New drop. WE THE WAVE.', tags: ['fits'] },
    { name: 'Vibe Drop Vol.7',  category: ['fits'], price: 204.99, image: r('/images/products/img_78.jpg'), images: [r('/images/products/img_78.jpg'), r('/images/products/img_79.jpg')], isNew: true, isSale: false, inStock: true, rating: 5, reviews: 0, sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black','White'], description: 'New drop. WE THE WAVE.', tags: ['fits'] },
    { name: 'Vibe Drop Vol.8',  category: ['fits'], price: 204.99, image: r('/images/products/img_80.jpg'), images: [r('/images/products/img_80.jpg'), r('/images/products/img_81.jpg')], isNew: true, isSale: false, inStock: true, rating: 5, reviews: 0, sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black','White'], description: 'New drop. WE THE WAVE.', tags: ['fits'] },
    { name: 'Vibe Drop Vol.9',  category: ['fits'], price: 209.99, image: r('/images/products/img_82.jpg'), images: [r('/images/products/img_82.jpg'), r('/images/products/img_83.jpg')], isNew: true, isSale: false, inStock: true, rating: 5, reviews: 0, sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black','White'], description: 'New drop. WE THE WAVE.', tags: ['fits'] },
    { name: 'Vibe Drop Vol.10', category: ['fits'], price: 209.99, image: r('/images/products/img_84.jpg'), images: [r('/images/products/img_84.jpg'), r('/images/products/img_85.jpg')], isNew: true, isSale: false, inStock: true, rating: 5, reviews: 0, sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black','White'], description: 'New drop. WE THE WAVE.', tags: ['fits'] },
    { name: 'Vibe Drop Vol.11', category: ['fits'], price: 214.99, image: r('/images/products/img_86.jpg'), images: [r('/images/products/img_86.jpg'), r('/images/products/img_87.jpg')], isNew: true, isSale: false, inStock: true, rating: 5, reviews: 0, sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black','White'], description: 'New drop. WE THE WAVE.', tags: ['fits'] },
    { name: 'Vibe Drop Vol.12', category: ['fits'], price: 214.99, image: r('/images/products/img_88.jpg'), images: [r('/images/products/img_88.jpg'), r('/images/products/img_89.jpg')], isNew: true, isSale: false, inStock: true, rating: 5, reviews: 0, sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black','White'], description: 'New drop. WE THE WAVE.', tags: ['fits'] },
    { name: 'Vibe Drop Vol.13', category: ['fits'], price: 219.99, image: r('/images/products/img_90.jpg'), images: [r('/images/products/img_90.jpg'), r('/images/products/img_91.jpg')], isNew: true, isSale: false, inStock: true, rating: 5, reviews: 0, sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black','White'], description: 'New drop. WE THE WAVE.', tags: ['fits'] },
    { name: 'Vibe Drop Vol.14', category: ['fits'], price: 219.99, image: r('/images/products/img_92.jpg'), images: [r('/images/products/img_92.jpg'), r('/images/products/img_93.jpg')], isNew: true, isSale: false, inStock: true, rating: 5, reviews: 0, sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black','White'], description: 'New drop. WE THE WAVE.', tags: ['fits'] },
    { name: 'Vibe Drop Vol.15', category: ['fits'], price: 224.99, image: r('/images/products/img_94.jpg'), images: [r('/images/products/img_94.jpg'), r('/images/products/img_95.jpg')], isNew: true, isSale: false, inStock: true, rating: 5, reviews: 0, sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black','White'], description: 'New drop. WE THE WAVE.', tags: ['fits'] },
    { name: 'Vibe Drop Vol.16', category: ['fits'], price: 224.99, image: r('/images/products/img_96.jpg'), images: [r('/images/products/img_96.jpg'), r('/images/products/img_97.jpg')], isNew: true, isSale: false, inStock: true, rating: 5, reviews: 0, sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black','White'], description: 'New drop. WE THE WAVE.', tags: ['fits'] },
    { name: 'Vibe Drop Vol.17', category: ['fits'], price: 229.99, image: r('/images/products/img_98.jpg'), images: [r('/images/products/img_98.jpg'), r('/images/products/img_99.jpg')], isNew: true, isSale: false, inStock: true, rating: 5, reviews: 0, sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black','White'], description: 'New drop. WE THE WAVE.', tags: ['fits'] },
    { name: 'Vibe Drop Vol.18', category: ['fits'], price: 229.99, image: r('/images/products/img_100.jpg'), images: [r('/images/products/img_100.jpg'), r('/images/products/img_101.jpg')], isNew: true, isSale: false, inStock: true, rating: 5, reviews: 0, sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black','White'], description: 'New drop. WE THE WAVE.', tags: ['fits'] },
    { name: 'Vibe Drop Vol.19', category: ['fits'], price: 234.99, image: r('/images/products/img_102.jpg'), images: [r('/images/products/img_102.jpg'), r('/images/products/img_103.jpg')], isNew: true, isSale: false, inStock: true, rating: 5, reviews: 0, sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black','White'], description: 'New drop. WE THE WAVE.', tags: ['fits'] },
    { name: 'Vibe Drop Vol.20', category: ['fits'], price: 234.99, image: r('/images/products/img_104.jpg'), images: [r('/images/products/img_104.jpg'), r('/images/products/img_105.jpg')], isNew: true, isSale: false, inStock: true, rating: 5, reviews: 0, sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black','White'], description: 'New drop. WE THE WAVE.', tags: ['fits'] },
    { name: 'Vibe Drop Vol.21', category: ['fits'], price: 239.99, image: r('/images/products/img_106.jpg'), images: [r('/images/products/img_106.jpg'), r('/images/products/img_107.jpg')], isNew: true, isSale: false, inStock: true, rating: 5, reviews: 0, sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black','White'], description: 'New drop. WE THE WAVE.', tags: ['fits'] },
    { name: 'Vibe Drop Vol.22', category: ['fits'], price: 239.99, image: r('/images/products/img_108.jpg'), images: [r('/images/products/img_108.jpg'), r('/images/products/img_109.jpg')], isNew: true, isSale: false, inStock: true, rating: 5, reviews: 0, sizes: ['XS','S','M','L','XL','XXL'], colors: ['Black','White'], description: 'New drop. WE THE WAVE.', tags: ['fits'] },
  ];
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  console.log('\n🚀 Vibewear Cloudinary Seed Script (Full Catalogue)\n');

  // 1. Upload images
  const urlMap = await uploadImages();
  console.log(`\n✅ Uploaded ${Object.keys(urlMap).length} images\n`);

  // 2. Connect to MongoDB
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // 3. Clear existing products
  const deleted = await Product.deleteMany({});
  console.log(`🗑️  Cleared ${deleted.deletedCount} existing products`);

  // 4. Insert with Cloudinary URLs
  const products = buildProducts(urlMap);
  await Product.insertMany(products);
  console.log(`✅ Seeded ${products.length} products with Cloudinary images!\n`);

  await mongoose.disconnect();
  console.log('🎉 Done! Your full catalogue is live on Cloudinary.\n');
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
