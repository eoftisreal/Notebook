const express = require('express');
const { z } = require('zod');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/admin');
const validate = require('../middleware/validate');
const Order = require('../models/Order');
const OrderStatusHistory = require('../models/OrderStatusHistory');

const Setting = require('../models/Setting');
const { getAdminSettings } = require('../utils/admin');
const QRCode = require('qrcode');


const router = express.Router();

router.get('/', auth, async (req, res, next) => {
  try {
    const orders = req.user.isAdmin
      ? await Order.find().sort({ createdAt: -1 })
      : await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', auth, async (req, res, next) => {
  try {
    const query = req.user.isAdmin ? { _id: req.params.id } : { _id: req.params.id, userId: req.user.id };
    const order = await Order.findOne(query);
    if (!order) {
      const err = new Error('Order not found');
      err.statusCode = 404;
      throw err;
    }
    res.json(order);
  } catch (error) {
    next(error);
  }
});

const trackGuestSchema = z.object({
  body: z.object({}),
  query: z.object({ email: z.string().email() }),
  params: z.object({ id: z.string() }),
});

router.get('/guest/track/:id', validate(trackGuestSchema), async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.validated.params.id, guestEmail: req.validated.query.email });
    if (!order) {
      const err = new Error('Guest order not found');
      err.statusCode = 404;
      throw err;
    }
    res.json(order);
  } catch (error) {
    next(error);
  }
});

const statusSchema = z.object({
  body: z.object({
    status: z.enum(['pending_payment', 'awaiting_verification', 'payment_verified', 'processing', 'shipped', 'delivered', 'rejected', 'cancelled']),
    note: z.string().optional(),
  }),
  query: z.object({}),
  params: z.object({ id: z.string() }),
});

router.patch('/:id/status', auth, adminOnly, validate(statusSchema), async (req, res, next) => {
  try {
    const order = await Order.findById(req.validated.params.id);
    if (!order) {
      const err = new Error('Order not found');
      err.statusCode = 404;
      throw err;
    }

    const oldStatus = order.status;
    order.status = req.validated.body.status;
    order.timeline.push({ status: req.validated.body.status, note: req.validated.body.note });
    await order.save();

    await OrderStatusHistory.create({
      orderId: order._id,
      oldStatus,
      newStatus: order.status,
      changedBy: req.user.id
    });

    res.json(order);
  } catch (error) {
    next(error);
  }
});


router.post('/:id/generate-qr', auth, async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user.id });
    if (!order) {
      const err = new Error('Order not found');
      err.statusCode = 404;
      throw err;
    }

    if (order.status !== 'pending_payment') {
      return res.status(400).json({ message: 'Order is not pending payment' });
    }

    // Update generated time
    order.qrGeneratedAt = new Date();
    await order.save();

    // Get settings
    const settingsDocs = await Setting.find({});
    const dynamicSettings = {};
    settingsDocs.forEach(s => { dynamicSettings[s.key] = s.value; });
    const staticSettings = getAdminSettings();
    const settings = { ...staticSettings, ...dynamicSettings };

    const upiId = settings.upiId || '';
    const payeeName = settings.upiPayeeName || '';

    // Generate UPI URL
    const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${order.paymentAmount}&cu=INR`;
    const qrCodeDataUrl = await QRCode.toDataURL(upiUrl);


    res.json({
      qrUrl: qrCodeDataUrl,
      upiUrl,
      paymentAmount: order.paymentAmount,
      upiId,
      expiresAt: new Date(order.qrGeneratedAt.getTime() + (settings.qrExpiryMinutes || 10) * 60000),
      utrEnabled: settings.utrEnabled,
      screenshotEnabled: settings.screenshotEnabled,
      verificationTimeout: settings.verificationTimeout || 60
    });

  } catch (error) {
    next(error);
  }
});

router.post('/:id/payment-done', auth, async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user.id });
    if (!order) {
      const err = new Error('Order not found');
      err.statusCode = 404;
      throw err;
    }

    if (order.status !== 'pending_payment' && order.status !== 'awaiting_verification') {
      return res.status(400).json({ message: 'Order is not pending payment or awaiting verification' });
    }

    const { utr, screenshotUrl } = req.body;
    let oldStatus = order.status;

    if (order.status === 'pending_payment') {
      order.status = 'awaiting_verification';
      order.paymentSubmittedAt = new Date();
      order.timeline.push({ status: 'awaiting_verification', note: 'Payment submitted, awaiting manual verification' });
    }

    if (utr) order.paymentUtr = utr;
    if (screenshotUrl) order.paymentScreenshotUrl = screenshotUrl;

    if (utr || screenshotUrl) {
      order.timeline.push({ status: 'awaiting_verification', note: 'Fallback payment proof submitted' });
    }

    await order.save();

    if (oldStatus !== order.status) {
      await OrderStatusHistory.create({
        orderId: order._id,
        oldStatus,
        newStatus: order.status,
        changedBy: req.user.id
      });
    }

    await OrderStatusHistory.create({
      orderId: order._id,
      oldStatus,
      newStatus: order.status,
      changedBy: req.user.id
    });

    // Empty cart upon payment submission
    await require('../models/Cart').findOneAndUpdate({ userId: req.user.id }, { $set: { items: [] } });

    res.json(order);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
