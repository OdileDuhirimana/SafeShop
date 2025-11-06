import mongoose from 'mongoose';

const priceAlertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  targetPrice: { type: Number, required: true, min: 0 },
  active: { type: Boolean, default: true },
  lastTriggeredAt: { type: Date, default: null },
}, { timestamps: true });

priceAlertSchema.index({ userId: 1, productId: 1 }, { unique: true });

export default mongoose.model('PriceAlert', priceAlertSchema);
