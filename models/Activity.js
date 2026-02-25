import mongoose from 'mongoose';

// Tracks daily active user visits — one document per user per day
const activitySchema = new mongoose.Schema({
  uid:   { type: String, required: true },  // Firebase UID
  email: { type: String },
  name:  { type: String },
  date:  { type: String, required: true },  // YYYY-MM-DD
}, { timestamps: true });

activitySchema.index({ uid: 1, date: 1 }, { unique: true }); // one per user per day

export default mongoose.model('Activity', activitySchema);
