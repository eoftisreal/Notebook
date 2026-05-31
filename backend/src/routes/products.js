const express = require('express');
const { z } = require('zod');
const validate = require('../middleware/validate');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/admin');

const router = express.Router();

const listSchema = z.object({
  body: z.object({}),
  query: z.object({
    q: z.string().optional(),
    category: z.string().optional(),
    minPrice: z.coerce.number().optional(),
    maxPrice: z.coerce.number().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(12),
  }),
  params: z.object({}),
});

router.get('/', validate(listSchema), async (req, res, next) => {
  try {
    const { q, category, minPrice, maxPrice, page, limit } = req.validated.query;
    const query = { isActive: true };

    if (q) {
      query.$text = { $search: q };
    }
    if (category) {
      query.category = category;
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = minPrice;
      if (maxPrice !== undefined) query.price.$lte = maxPrice;
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Product.countDocuments(query),
    ]);

    res.json({ products, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      const err = new Error('Product not found');
      err.statusCode = 404;
      throw err;
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
});

const createSchema = z.object({
  body: z.object({
    title: z.string().min(2),
    description: z.string().min(10),
    artistName: z.string().min(2),
    category: z.string().min(2),
    images: z.array(z.string().url()).default([]),
    r2ImageKeys: z.array(z.string()).default([]),
    price: z.number().nonnegative(),
    compareAtPrice: z.number().nonnegative().optional(),
    stock: z.number().int().nonnegative().default(0),
    tags: z.array(z.string()).default([]),
  }),
  query: z.object({}),
  params: z.object({}),
});

router.post('/', auth, adminOnly, validate(createSchema), async (req, res, next) => {
  try {
    const product = await Product.create(req.validated.body);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', auth, adminOnly, validate(createSchema), async (req, res, next) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.validated.body, { new: true });
    if (!updated) {
      const err = new Error('Product not found');
      err.statusCode = 404;
      throw err;
    }
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', auth, adminOnly, async (req, res, next) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) {
      const err = new Error('Product not found');
      err.statusCode = 404;
      throw err;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
