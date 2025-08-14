import mongoose from 'mongoose';

const referralSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uses: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Referral', referralSchema);
