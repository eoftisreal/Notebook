const express = require('express');
const { z } = require('zod');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

const router = express.Router();

router.use(auth);

async function getCart(userId) {
  return Cart.findOneAndUpdate({ userId }, { $setOnInsert: { userId, items: [] } }, { upsert: true, new: true });
}

router.get('/', async (req, res, next) => {
  try {
    const cart = await getCart(req.user.id);
    await cart.populate('items.productId');
    res.json(cart);
  } catch (error) {
    next(error);
  }
});

const itemSchema = z.object({
  body: z.object({
    productId: z.string(),
    quantity: z.number().int().min(1),
  }),
  query: z.object({}),
  params: z.object({}),
});

router.post('/items', validate(itemSchema), async (req, res, next) => {
  try {
    const { productId, quantity } = req.validated.body;
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      const err = new Error('Product unavailable');
      err.statusCode = 400;
      throw err;
    }

    const cart = await getCart(req.user.id);
    const existing = cart.items.find((item) => item.productId.toString() === productId);
    if (existing) {
      existing.quantity = quantity;
    } else {
      cart.items.push({ productId, quantity });
    }

    await cart.save();
    await cart.populate('items.productId');
    res.json(cart);
  } catch (error) {
    next(error);
  }
});

router.delete('/items/:productId', async (req, res, next) => {
  try {
    const cart = await getCart(req.user.id);
    cart.items = cart.items.filter((item) => item.productId.toString() !== req.params.productId);
    await cart.save();
    await cart.populate('items.productId');
    res.json(cart);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
