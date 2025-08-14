import mongoose from 'mongoose';

const discountSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  percent: { type: Number, min: 0, max: 100, required: true },
  active: { type: Boolean, default: true },
  expiresAt: { type: Date }
}, { timestamps: true });

export default mongoose.model('Discount', discountSchema);
