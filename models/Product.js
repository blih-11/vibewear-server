import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  category:      { type: [String], required: true },
  price:         { type: Number, required: true },
  originalPrice: { type: Number, default: null },
  image:         { type: String, required: true },
  images:        { type: [String], default: [] },
  isNew:         { type: Boolean, default: false },
  isSale:        { type: Boolean, default: false },
  inStock:       { type: Boolean, default: true },
  rating:        { type: Number, default: 5 },
  reviews:       { type: Number, default: 0 },
  sizes:         { type: [String], default: [] },
  colors:        { type: [String], default: [] },
  description:   { type: String, default: '' },
  tags:          { type: [String], default: [] },
}, { timestamps: true });

export default mongoose.model('Product', productSchema);
