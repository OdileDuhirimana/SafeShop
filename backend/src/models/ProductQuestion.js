import mongoose from 'mongoose';

const productQuestionSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  question: { type: String, required: true },
  answer: { type: String, default: '' },
  answeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, enum: ['open', 'answered'], default: 'open' },
}, { timestamps: true });

export default mongoose.model('ProductQuestion', productQuestionSchema);
