import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  ip: String,
  meta: Object,
}, { timestamps: true });

export default mongoose.model('ActivityLog', activityLogSchema);
