const express = require('express');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/admin');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { getAdminSettings } = require('../utils/admin');

const router = express.Router();

router.use(auth, adminOnly);

router.get('/analytics', async (_req, res, next) => {
  try {
    const [totalProducts, totalOrders, revenueData] = await Promise.all([
      Product.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([{ $group: { _id: null, revenue: { $sum: '$total' } } }]),
    ]);

    res.json({
      totalProducts,
      totalOrders,
      totalRevenue: revenueData[0]?.revenue || 0,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/settings', (_req, res) => {
  res.json(getAdminSettings());
});

module.exports = router;
