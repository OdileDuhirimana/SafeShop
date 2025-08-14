import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['customer','seller','admin'], default: 'customer' },
  passwordHash: { type: String, required: true },
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String, default: null },
  loyaltyPoints: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
