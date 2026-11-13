import { Router } from 'express';
import Product from '../models/Product.js';
import Sale from '../models/Sale.js';
import { protect } from '../middleware/auth.js';
const router = Router();
router.use(protect);

router.get('/alerts/low-stock', async (req, res, next) => {
  try {
    const items = await Product.find({ business: req.user.business, $expr: { $lte: ['$quantity', '$reorderLevel'] } })
      .sort({ quantity: 1 }).limit(500).lean();
    res.json(items);
  } catch (e) { next(e); }
});

router.get('/analytics/summary', async (req, res, next) => {
  try {
    const business = req.user.business;
    const [totalProducts, lowStock, stockValue, sales] = await Promise.all([
      Product.countDocuments({ business }),
      Product.countDocuments({ business, $expr: { $lte: ['$quantity', '$reorderLevel'] } }),
      Product.aggregate([{ $match: { business: req.user.business } }, { $group: { _id: null, value: { $sum: { $multiply: ['$quantity', '$price'] } } } }]),
      Sale.aggregate([{ $match: { business: req.user.business, soldAt: { $gte: new Date(Date.now() - 30 * 86400000) } } }, { $group: { _id: null, units: { $sum: '$quantity' }, revenue: { $sum: '$total' } } }])
    ]);
    res.json({ totalProducts, lowStock, stockValue: stockValue[0]?.value || 0, unitsSold30Days: sales[0]?.units || 0, revenue30Days: sales[0]?.revenue || 0 });
  } catch (e) { next(e); }
});

router.get('/analytics/trends', async (req, res, next) => {
  try {
    const rows = await Sale.aggregate([
      { $match: { business: req.user.business, soldAt: { $gte: new Date(Date.now() - 30 * 86400000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$soldAt' } }, units: { $sum: '$quantity' }, revenue: { $sum: '$total' } } },
      { $sort: { _id: 1 } }
    ]);
    res.json(rows.map(r => ({ date: r._id, units: r.units, revenue: r.revenue })));
  } catch (e) { next(e); }
});

router.get('/restock/suggestions', async (req, res, next) => {
  try {
    const since = new Date(Date.now() - 30 * 86400000);
    const sold = await Sale.aggregate([
      { $match: { business: req.user.business, soldAt: { $gte: since } } },
      { $group: { _id: '$product', unitsSold30Days: { $sum: '$quantity' } } }
    ]);
    const salesMap = new Map(sold.map(s => [String(s._id), s.unitsSold30Days]));
    const products = await Product.find({ business: req.user.business }).lean();
    const suggestions = products.map(p => {
      const sold30 = salesMap.get(String(p._id)) || 0;
      const dailyAverage = sold30 / 30;
      const targetStock = Math.ceil(dailyAverage * 14);
      return { productId: p._id, name: p.name, currentStock: p.quantity, unitsSold30Days: sold30,
        averageDailySales: Number(dailyAverage.toFixed(2)), suggestedOrder: Math.max(0, targetStock - p.quantity) };
    }).filter(p => p.suggestedOrder > 0).sort((a, b) => b.suggestedOrder - a.suggestedOrder);
    res.json(suggestions);
  } catch (e) { next(e); }
});
export default router;
