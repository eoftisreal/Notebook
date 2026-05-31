const mongoose = require('mongoose');

const magicLinkSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    consumedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MagicLink', magicLinkSchema);
