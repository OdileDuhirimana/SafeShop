import mongoose from 'mongoose';

const orderEventSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  byUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  type: { type: String, required: true },
  note: { type: String, default: '' },
  meta: { type: Object, default: {} },
}, { timestamps: true });

export default mongoose.model('OrderEvent', orderEventSchema);
