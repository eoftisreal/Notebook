const express = require('express');
const { z } = require('zod');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const { createRazorpayOrder, verifyRazorpaySignature } = require('../utils/payment');

const router = express.Router();

const checkoutSchema = z.object({
  body: z.object({
    shippingAddress: z.object({
      line1: z.string().min(2),
      line2: z.string().optional(),
      city: z.string().min(2),
      state: z.string().min(2),
      postalCode: z.string().min(3),
      country: z.string().min(2),
    }),
    deliveryMethod: z.enum(['email', 'whatsapp']),
    promoCode: z.string().optional(),
  }),
  query: z.object({}),
  params: z.object({}),
});

router.post('/create', auth, validate(checkoutSchema), async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      const err = new Error('Cart is empty');
      err.statusCode = 400;
      throw err;
    }

    const subtotal = cart.items.reduce((sum, item) => sum + item.productId.price * item.quantity, 0);
    const tax = Number((subtotal * 0.18).toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));

    const paymentOrder = await createRazorpayOrder({
      amount: Math.round(total * 100),
      receipt: `ord_${Date.now()}`,
    });

    const items = cart.items.map((item) => ({
      productId: item.productId.id,
      title: item.productId.title,
      quantity: item.quantity,
      unitPrice: item.productId.price,
    }));

    const order = await Order.create({
      userId: req.user.id,
      items,
      subtotal,
      tax,
      total,
      shippingAddress: req.validated.body.shippingAddress,
      deliveryMethod: req.validated.body.deliveryMethod,
      promoCode: req.validated.body.promoCode,
      payment: {
        provider: 'razorpay',
        orderId: paymentOrder.id,
        status: paymentOrder.status || 'created',
      },
      timeline: [{ status: 'created', note: 'Order created and awaiting payment' }],
    });

    res.status(201).json({ order, paymentOrder });
  } catch (error) {
    next(error);
  }
});

const verifySchema = z.object({
  body: z.object({
    orderId: z.string(),
    paymentId: z.string(),
    signature: z.string(),
  }),
  query: z.object({}),
  params: z.object({}),
});

router.post('/verify', auth, validate(verifySchema), async (req, res, next) => {
  try {
    const { orderId, paymentId, signature } = req.validated.body;
    const valid = verifyRazorpaySignature({ orderId, paymentId, signature });

    if (!valid) {
      const err = new Error('Payment signature verification failed');
      err.statusCode = 400;
      throw err;
    }

    const order = await Order.findOne({ 'payment.orderId': orderId, userId: req.user.id });
    if (!order) {
      const err = new Error('Order not found');
      err.statusCode = 404;
      throw err;
    }

    order.payment.paymentId = paymentId;
    order.payment.signature = signature;
    order.payment.status = 'captured';
    order.status = 'payment_confirmed';
    order.timeline.push({ status: 'payment_confirmed', note: 'Payment confirmed' });
    await order.save();

    await Cart.findOneAndUpdate({ userId: req.user.id }, { $set: { items: [] } });

    res.json(order);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
