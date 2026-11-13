import mongoose from 'mongoose';
const saleSchema = new mongoose.Schema({
  business: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
  soldAt: { type: Date, default: Date.now, index: true },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });
saleSchema.index({ business: 1, soldAt: -1 });
saleSchema.index({ business: 1, product: 1, soldAt: -1 });
export default mongoose.model('Sale', saleSchema);
