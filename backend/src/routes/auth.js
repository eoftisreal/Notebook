const express = require('express');
const { z } = require('zod');
const crypto = require('crypto');
const validate = require('../middleware/validate');
const MagicLink = require('../models/MagicLink');
const User = require('../models/User');
const env = require('../config/env');
const { sendMagicLinkEmail } = require('../utils/sendEmail');
const { signAccessToken } = require('../utils/jwt');

const router = express.Router();

const requestMagicSchema = z.object({
  body: z.object({
    email: z.string().email(),
    name: z.string().optional(),
  }),
  query: z.object({}),
  params: z.object({}),
});

router.post('/magic-link/request', validate(requestMagicSchema), async (req, res, next) => {
  try {
    const { email } = req.validated.body;
    const magicToken = crypto.randomBytes(36).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await MagicLink.create({ email, token: magicToken, expiresAt });

    const magicUrl = `${env.appUrl}/auth/callback?token=${encodeURIComponent(magicToken)}`;
    const mail = await sendMagicLinkEmail(email, magicUrl);

    res.status(202).json({ message: 'Magic link sent', delivery: mail });
  } catch (error) {
    if (error.code === 11000) {
      error.statusCode = 429;
      error.message = 'Please wait before requesting another magic link';
    }
    next(error);
  }
});

const signupSchema = z.object({
  body: z.object({
    email: z.string().email(),
    name: z.string().min(1),
  }),
  query: z.object({}),
  params: z.object({}),
});

router.post('/signup', validate(signupSchema), async (req, res, next) => {
  try {
    const { email, name } = req.validated.body;

    // Create the user immediately so we can store the name.
    // If the user already exists, this could just update or be a no-op depending on preference.
    // We'll update the user if they exist or insert them if they don't.
    await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { $set: { name }, $setOnInsert: { email: email.toLowerCase() } },
      { upsert: true, new: true }
    );

    const magicToken = crypto.randomBytes(36).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await MagicLink.create({ email: email.toLowerCase(), token: magicToken, expiresAt });

    const magicUrl = `${env.appUrl}/auth/callback?token=${encodeURIComponent(magicToken)}`;
    const mail = await sendMagicLinkEmail(email, magicUrl);

    res.status(202).json({ message: 'Account created and magic link sent', delivery: mail });
  } catch (error) {
    if (error.code === 11000) {
      error.statusCode = 429;
      error.message = 'Please wait before requesting another magic link';
    }
    next(error);
  }
});

const verifySchema = z.object({
  body: z.object({ token: z.string().min(20) }),
  query: z.object({}),
  params: z.object({}),
});

router.post('/magic-link/verify', validate(verifySchema), async (req, res, next) => {
  try {
    const { token } = req.validated.body;
    const record = await MagicLink.findOne({ token });

    if (!record || record.consumedAt || record.expiresAt < new Date()) {
      const err = new Error('Magic link is invalid or expired');
      err.statusCode = 400;
      throw err;
    }

    record.consumedAt = new Date();
    await record.save();

    const user = await User.findOneAndUpdate(
      { email: record.email },
      { $setOnInsert: { email: record.email } },
      { upsert: true, new: true }
    );

    const tokenValue = signAccessToken({ sub: user.id, email: user.email, isAdmin: user.isAdmin });

    res.json({ token: tokenValue, user });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
