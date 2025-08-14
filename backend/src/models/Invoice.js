import mongoose from 'mongoose';

const encryptedPayloadSchema = new mongoose.Schema({
  iv: String,
  authTag: String,
  data: String,
}, { _id: false })

const invoiceSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  currency: { type: String, default: 'USD' },
  total: Number,
  tax: Number,
  discountApplied: Number,
  payload: encryptedPayloadSchema,
}, { timestamps: true })

export default mongoose.model('Invoice', invoiceSchema)
