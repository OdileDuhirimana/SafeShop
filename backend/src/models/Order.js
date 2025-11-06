import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  title: String,
  price: Number,
  quantity: Number
});

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  total: Number,
  status: {
    type: String,
    enum: ['pending','paid','failed','processing','shipped','delivered','canceled','returned','refunded'],
    default: 'pending'
  },
  paymentIntentId: String,
  trackingNumber: { type: String, default: null },
  cancellationReason: { type: String, default: null },
  deliveredAt: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
