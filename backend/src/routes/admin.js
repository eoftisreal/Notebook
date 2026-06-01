const express = require('express');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/admin');
const Product = require('../models/Product');
const multer = require('multer');
const Order = require('../models/Order');
const { getAdminSettings } = require('../utils/admin');
const { uploadToR2, getObjectUrl } = require('../utils/r2');

const router = express.Router();

router.use(auth, adminOnly);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

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

router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const key = await uploadToR2(req.file.buffer, req.file.mimetype, req.file.originalname);
    const url = getObjectUrl(key);

    res.json({ key, url });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
