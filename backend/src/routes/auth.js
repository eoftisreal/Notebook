const express = require('express');
const { z } = require('zod');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const validate = require('../middleware/validate');
const MagicLink = require('../models/MagicLink');
const User = require('../models/User');
const OTP = require('../models/OTP');
const env = require('../config/env');
const { sendMagicLinkEmail } = require('../utils/sendEmail');
const { sendSMS } = require('../utils/sendSms');
const { signAccessToken } = require('../utils/jwt');

const router = express.Router();

// --- NEW AUTH FLOW (PHONE/OTP + USERNAME/PASSWORD) ---

// 1. Send OTP for signup or password reset
const sendOtpSchema = z.object({
  body: z.object({
    phone: z.string().min(10),
  }),
  query: z.object({}),
  params: z.object({}),
});

router.post('/send-otp', validate(sendOtpSchema), async (req, res, next) => {
  try {
    const { phone } = req.validated.body;

    // Generate 6 digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store in DB
    await OTP.create({ phone, otp: otpCode, expiresAt });

    // Send via SMS
    const delivery = await sendSMS(phone, `Your OTP is: ${otpCode}. It will expire in 10 minutes.`);

    // If twilio isn't setup locally, log it so we can test
    if (delivery.skipped) {
      console.log(`[Twilio Skipped] OTP for ${phone} is: ${otpCode}`);
    }

    res.status(200).json({ message: 'OTP sent', skipped: delivery.skipped });
  } catch (error) {
    next(error);
  }
});

// 2. Complete Signup (Verify OTP & Create User)
const signupCompleteSchema = z.object({
  body: z.object({
    phone: z.string().min(10),
    otp: z.string().length(6),
    username: z.string().min(3),
    password: z.string().min(6),
    name: z.string().min(1),
    address: z.object({
      state: z.string().min(1).optional(),
      district: z.string().min(1).optional(),
      pinCode: z.string().optional(),
      landmark: z.string().optional()
    }).optional()
  }),
  query: z.object({}),
  params: z.object({}),
});

router.post('/signup-complete', validate(signupCompleteSchema), async (req, res, next) => {
  try {
    const { phone, otp, username, password, name, address } = req.validated.body;

    // Verify OTP
    const validOtp = await OTP.findOne({
      phone,
      otp,
      consumedAt: null,
      expiresAt: { $gt: new Date() }
    });

    if (!validOtp) {
      const err = new Error('Invalid or expired OTP');
      err.statusCode = 400;
      throw err;
    }

    // Check if phone or username already exists
    const existingUser = await User.findOne({ $or: [{ phone }, { username: username.toLowerCase() }] });
    if (existingUser) {
      const err = new Error('User with this phone number or username already exists');
      err.statusCode = 400;
      throw err;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const masterAccessCode = crypto.randomBytes(8).toString('hex').toUpperCase();

    // Create user
    const user = await User.create({
      phone,
      username: username.toLowerCase(),
      password: hashedPassword,
      name,
      address,
      masterAccessCode
    });

    // Mark OTP as consumed
    validOtp.consumedAt = new Date();
    await validOtp.save();

    // Log them in immediately
    const tokenValue = signAccessToken({ sub: user.id, username: user.username, isAdmin: user.isAdmin });

    res.status(201).json({
      message: 'Account created successfully',
      token: tokenValue,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        phone: user.phone,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    next(error);
  }
});

// 3. Login with Phone OR Username + Password
const loginSchema = z.object({
  body: z.object({
    identifier: z.string().min(1), // Phone or username
    password: z.string().min(1),
  }),
  query: z.object({}),
  params: z.object({}),
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { identifier, password } = req.validated.body;

    // Find by phone or username
    const user = await User.findOne({
      $or: [
        { phone: identifier },
        { username: identifier.toLowerCase() }
      ]
    });

    if (!user) {
      const err = new Error('Invalid credentials');
      err.statusCode = 401;
      throw err;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      const err = new Error('Invalid credentials');
      err.statusCode = 401;
      throw err;
    }

    const tokenValue = signAccessToken({ sub: user.id, username: user.username, isAdmin: user.isAdmin });

    res.json({
      token: tokenValue,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        phone: user.phone,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    next(error);
  }
});

// 4. Reset Password
const resetPasswordSchema = z.object({
  body: z.object({
    phone: z.string().min(10),
    otp: z.string().length(6),
    newPassword: z.string().min(6),
  }),
  query: z.object({}),
  params: z.object({}),
});

router.post('/reset-password', validate(resetPasswordSchema), async (req, res, next) => {
  try {
    const { phone, otp, newPassword } = req.validated.body;

    // Verify OTP
    const validOtp = await OTP.findOne({
      phone,
      otp,
      consumedAt: null,
      expiresAt: { $gt: new Date() }
    });

    if (!validOtp) {
      const err = new Error('Invalid or expired OTP');
      err.statusCode = 400;
      throw err;
    }

    const user = await User.findOne({ phone });
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    validOtp.consumedAt = new Date();
    await validOtp.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
});


// --- OLD MAGIC LINK FLOW (DISCONNECTED/COMMENTED OUT FOR NOW) ---
/*
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
*/

module.exports = router;
