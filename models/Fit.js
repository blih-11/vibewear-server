import mongoose from 'mongoose';

// A "Fit" is a curated bundle shown in the homepage's "Curated For You"
// section — e.g. a flat-lay photo of a shirt + shorts + shoes. It deliberately
// stores only references to real Products, never copies of their price/name/
// image — those are always read live from the Product collection (same
// reasoning as the order-pricing fix: a copied price can drift out of sync
// and become a source of truth nothing actually checks).
const fitSchema = new mongoose.Schema({
  name:   { type: String, required: true, trim: true },
  image:  { type: String, required: true }, // the outfit/flat-lay photo shown on the homepage card
  items:  {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }],
    validate: v => v.length >= 2 || 'A fit needs at least 2 items.',
  },
  active: { type: Boolean, default: true }, // lets an admin hide a fit without deleting it
}, { timestamps: true });

export default mongoose.model('Fit', fitSchema);
