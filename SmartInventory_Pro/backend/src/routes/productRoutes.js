import { Router } from 'express';
import Product from '../models/Product.js';
import { protect, allowRoles } from '../middleware/auth.js';
const router = Router();
router.use(protect);

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const filter = { business: req.user.business };
    if (req.query.search) filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { category: { $regex: req.query.search, $options: 'i' } },
      { barcode: String(req.query.search) }
    ];
    const [items, total] = await Promise.all([
      Product.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Product.countDocuments(filter)
    ]);
    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, category, barcode, quantity, price, reorderLevel } = req.body;
    if (!name || Number(quantity) < 0 || Number(price) < 0) return res.status(400).json({ message: 'Valid name, quantity and price are required' });
    const count = await Product.countDocuments({ business: req.user.business });
    if (count >= 100000) return res.status(409).json({ message: 'This business has reached its 100,000 item limit' });
    const item = await Product.create({ business: req.user.business, name, category, barcode: barcode || undefined, quantity, price, reorderLevel });
    res.status(201).json(item);
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const allowed = ['name', 'category', 'barcode', 'quantity', 'price', 'reorderLevel'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    const item = await Product.findOneAndUpdate({ _id: req.params.id, business: req.user.business }, updates, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ message: 'Product not found' });
    res.json(item);
  } catch (e) { next(e); }
});

router.delete('/:id', allowRoles('admin'), async (req, res, next) => {
  try {
    const item = await Product.findOneAndDelete({ _id: req.params.id, business: req.user.business });
    if (!item) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (e) { next(e); }
});
export default router;
