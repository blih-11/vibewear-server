// ONE-TIME migration: product prices used to be stored in USD (and converted for
// display). The store is now GHS-only, so stored prices must become real GHS numbers.
//
//   Dry run (changes nothing, prints what WOULD change):
//     node scripts/migrate-prices-usd-to-ghs.js --rate 15.5
//   Apply for real:
//     node scripts/migrate-prices-usd-to-ghs.js --rate 15.5 --apply
//
// Run it ONCE. Running it twice multiplies prices twice. Back up the DB first.
// Needs MONGO_URI in the environment (same as the server).
import 'dotenv/config';
import mongoose from 'mongoose';
import Product from '../models/Product.js';

const args = process.argv.slice(2);
const rate = parseFloat(args[args.indexOf('--rate') + 1]);
const apply = args.includes('--apply');

if (!Number.isFinite(rate) || rate <= 0) {
  console.error('Usage: node scripts/migrate-prices-usd-to-ghs.js --rate <USD→GHS rate> [--apply]');
  process.exit(1);
}

const round2 = (n) => Math.round(n * 100) / 100;

await mongoose.connect(process.env.MONGO_URI);
const products = await Product.find({});
console.log(`${apply ? 'APPLYING' : 'DRY RUN'} — rate ${rate}, ${products.length} products\n`);

for (const p of products) {
  const newPrice = round2(p.price * rate);
  const newOriginal = p.originalPrice ? round2(p.originalPrice * rate) : p.originalPrice;
  console.log(`${p.name}: ${p.price} → ${newPrice}${p.originalPrice ? `  (was-price ${p.originalPrice} → ${newOriginal})` : ''}`);
  if (apply) {
    p.price = newPrice;
    p.originalPrice = newOriginal;
    await p.save();
  }
}

console.log(apply ? '\nDone.' : '\nNothing changed. Re-run with --apply to write these.');
await mongoose.disconnect();
