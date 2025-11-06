import mongoose from 'mongoose';

const savedPaymentMethodSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  provider: { type: String, enum: ['card', 'paypal', 'applepay', 'googlepay'], default: 'card' },
  brand: { type: String, default: 'visa' },
  last4: { type: String, required: true },
  expMonth: { type: Number, min: 1, max: 12, default: 1 },
  expYear: { type: Number, min: 2000, default: 2030 },
  tokenRef: { type: String, required: true },
  billingPostalCode: { type: String, default: '' },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('SavedPaymentMethod', savedPaymentMethodSchema);
