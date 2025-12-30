const mongoose = require('mongoose');

const ReferralSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, index: true },
  deviceId: { type: String, required: true, unique: true, index: true },
  discount: { type: Number, required: true, default: 0.2 },
  maxRedemptions: { type: Number, default: 1 },
  redeemedCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: () => new Date() }
});

module.exports = mongoose.model('Referral', ReferralSchema);
