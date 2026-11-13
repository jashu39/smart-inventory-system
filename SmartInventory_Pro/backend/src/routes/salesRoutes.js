import { Router } from 'express';
import Product from '../models/Product.js';
import Sale from '../models/Sale.js';
import { protect } from '../middleware/auth.js';
const router = Router();

router.post('/sales', protect, async (req, res, next) => {
  let updatedProduct;
  try {
    const { productId, quantity } = req.body;
    const qty = Number(quantity);
    if (!productId || !Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({ message: 'Choose a product and valid quantity' });
    }

    // Atomic stock decrement prevents two sales from overselling the same units.
    updatedProduct = await Product.findOneAndUpdate(
      { _id: productId, business: req.user.business, quantity: { $gte: qty } },
      { $inc: { quantity: -qty } },
      { new: true }
    );
    if (!updatedProduct) {
      const exists = await Product.exists({ _id: productId, business: req.user.business });
      return res.status(exists ? 400 : 404).json({
        message: exists ? 'Not enough stock' : 'Product not found'
      });
    }

    try {
      const sale = await Sale.create({
        business: req.user.business, product: updatedProduct._id,
        productName: updatedProduct.name, quantity: qty,
        unitPrice: updatedProduct.price, total: qty * updatedProduct.price,
        recordedBy: req.user._id
      });
      return res.status(201).json(sale);
    } catch (saleError) {
      // Best-effort compensation if sale history could not be saved.
      await Product.updateOne({ _id: updatedProduct._id, business: req.user.business }, { $inc: { quantity: qty } });
      throw saleError;
    }
  } catch (e) { next(e); }
});

router.get('/sales/history', protect, async (req, res, next) => {
  try {
    const sales = await Sale.find({ business: req.user.business }).sort({ soldAt: -1 }).limit(200).lean();
    res.json(sales);
  } catch (e) { next(e); }
});
export default router;
