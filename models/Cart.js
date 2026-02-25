import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  productId: String,
  name:      String,
  image:     String,
  price:     Number,
  size:      String,
  color:     String,
  quantity:  Number,
  key:       String,
}, { _id: false });

const cartSchema = new mongoose.Schema({
  uid:   { type: String, required: true, unique: true },
  items: { type: [cartItemSchema], default: [] },
}, { timestamps: true });

export default mongoose.model('Cart', cartSchema);
