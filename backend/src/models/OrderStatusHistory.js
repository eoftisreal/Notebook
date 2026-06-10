const mongoose = require('mongoose');

const orderStatusHistorySchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    oldStatus: { type: String, required: true },
    newStatus: { type: String, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model('OrderStatusHistory', orderStatusHistorySchema);
