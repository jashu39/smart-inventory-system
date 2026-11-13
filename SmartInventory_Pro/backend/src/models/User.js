import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'staff'], default: 'staff' },
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true }
}, { timestamps: true });
userSchema.index({ email: 1, business: 1 }, { unique: true });
export default mongoose.model('User', userSchema);
