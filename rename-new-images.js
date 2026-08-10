/**
 * STEP 1 — Run this FIRST (one time only)
 *
 * Renames all SnapInsta*.jpg files in your store's products folder
 * to img_66.jpg, img_67.jpg, ... img_109.jpg
 *
 * Usage:
 *   node rename-new-images.js /path/to/VIbe/public/images/products
 *
 * Example:
 *   node rename-new-images.js ../VIbe/public/images/products
 */

import fs from 'fs';
import path from 'path';

const dir = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve('../VIbe/public/images/products');

if (!fs.existsSync(dir)) {
  console.error(`❌ Folder not found: ${dir}`);
  process.exit(1);
}

// Get all SnapInsta files, excluding "(1)" duplicates
const files = fs
  .readdirSync(dir)
  .filter(f => f.startsWith('SnapInsta') && f.endsWith('.jpg') && !f.includes('(1)'))
  .sort();

console.log(`\n📸 Found ${files.length} new SnapInsta images to rename\n`);

let counter = 66;
for (const file of files) {
  const oldPath = path.join(dir, file);
  const newName = `img_${counter}.jpg`;
  const newPath = path.join(dir, newName);

  if (fs.existsSync(newPath)) {
    console.log(`  ⚠️  Skipping ${newName} — already exists`);
    counter++;
    continue;
  }

  fs.renameSync(oldPath, newPath);
  console.log(`  ✅ ${file} → ${newName}`);
  counter++;
}

// Also delete the (1) duplicates
const dupes = fs.readdirSync(dir).filter(f => f.includes('(1)') && f.endsWith('.jpg'));
if (dupes.length > 0) {
  console.log(`\n🗑️  Removing ${dupes.length} duplicate file(s):`);
  for (const dupe of dupes) {
    fs.unlinkSync(path.join(dir, dupe));
    console.log(`  🗑️  Deleted: ${dupe}`);
  }
}

console.log(`\n✅ Done! Images are now img_66.jpg through img_${counter - 1}.jpg`);
console.log('   Now run: node seed-cloudinary.js ../VIbe/public/images/products\n');
