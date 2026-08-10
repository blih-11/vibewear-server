import mongoose from 'mongoose';

const instagramPostSchema = new mongoose.Schema({
  url:    { type: String, required: true, trim: true },
  order:  { type: Number, default: 0 },
  active: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('InstagramPost', instagramPostSchema);
