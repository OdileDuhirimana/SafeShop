import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  images: [String],
  category: String,
  brand: String,
  rating: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  flashPrice: { type: Number, default: null },
  flashEnds: { type: Date, default: null },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Product', productSchema);
