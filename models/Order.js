import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: String,
  name:      String,
  image:     String,
  price:     Number,
  size:      String,
  color:     String,
  quantity:  Number,
}, { _id: false });

const orderSchema = new mongoose.Schema({
  uid:           { type: String, required: true, index: true },
  email:         { type: String },
  items:         { type: [orderItemSchema], default: [] },
  subtotal:      { type: Number, required: true },
  shipping:      { type: Number, default: 0 },
  total:         { type: Number, required: true },
  customer: {
    firstName:   String,
    lastName:    String,
    phone:       String,
    address:     String,
    address2:    String,
    city:        String,
    stateRegion: String,
    postalCode:  String,
    country:     String,
    notes:       String,
  },
  txRef:         { type: String },
  transactionId: { type: String },
  status:        { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' },
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
