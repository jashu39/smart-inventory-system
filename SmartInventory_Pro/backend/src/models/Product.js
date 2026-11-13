
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    category: {
      type: String,
      default: 'General',
      trim: true
    },

    barcode: {
      type: String,
      trim: true
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },

    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },

    reorderLevel: {
      type: Number,
      min: 0,
      default: 5
    }
  },
  {
    timestamps: true
  }
);

// Indexes for faster product searches
productSchema.index({ business: 1, name: 1 });
productSchema.index(
  { business: 1, barcode: 1 },
  { unique: true, sparse: true }
);
productSchema.index({ business: 1, quantity: 1 });

// Low-stock virtual property
productSchema.virtual('isLowStock').get(function () {
  return this.quantity <= this.reorderLevel;
});

// Include virtual properties in API output
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const Product = mongoose.model('Product', productSchema);

export default Product;
