import mongoose from 'mongoose';

const returnItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  reason: { type: String, default: '' },
}, { _id: false });

const returnRequestSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  items: [returnItemSchema],
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'received', 'refunded'], default: 'pending' },
  resolutionNote: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('ReturnRequest', returnRequestSchema);
