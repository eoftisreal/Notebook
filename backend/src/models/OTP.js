const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true, expires: '10m' },
    consumedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('OTP', otpSchema);
