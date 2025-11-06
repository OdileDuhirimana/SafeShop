import mongoose from 'mongoose';

const searchQuerySchema = new mongoose.Schema({
  query: { type: String, required: true, unique: true, index: true },
  count: { type: Number, default: 1 },
  lastSearchedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('SearchQuery', searchQuerySchema);
