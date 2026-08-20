import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  // 'category'  → customer-facing: shows in the Shop dropdown + Products filter
  // 'section'   → admin-only curation tag, e.g. "Featured Editorial" — used to hand-pick
  //               which products appear in a homepage section, never shown to customers
  //               as a filter option.
  type: { type: String, enum: ['category', 'section'], default: 'category' },
}, { timestamps: true });

export default mongoose.model('Category', categorySchema);