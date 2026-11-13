import mongoose from 'mongoose';
const businessSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, index: true }
}, { timestamps: true });
export default mongoose.model('Business', businessSchema);
