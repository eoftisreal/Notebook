const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, sparse: true, trim: true },
    username: { type: String, required: true, unique: true, sparse: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    isAdmin: { type: Boolean, default: false },
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
