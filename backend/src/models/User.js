const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    password: { type: String },
    name: { type: String, trim: true },
    role: { type: String, enum: ['user', 'admin', 'master_admin'], default: 'user' },
    isAdmin: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String, default: null },
    address: {
      state: { type: String, trim: true },
      district: { type: String, trim: true },
      pinCode: { type: String, trim: true },
      landmark: { type: String, trim: true }
    },
    masterAccessCode: { type: String, unique: true, sparse: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
