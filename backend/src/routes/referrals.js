const express = require('express');
const router = express.Router();
const Referral = require('../models/Referral');

// Generate human-friendly code
function generateCode() {
  const suffix = Math.random().toString(36).substring(2,8).toUpperCase();
  return `MTM20-${suffix}`;
}

// Create or return existing referral for a device
router.post('/create', async (req, res) => {
  const { deviceId } = req.body || {};
  if (!deviceId) return res.status(400).json({ error: 'MISSING_DEVICE_ID' });

  try {
    let existing = await Referral.findOne({ deviceId });
    if (existing) return res.json({ code: existing.code, discount: existing.discount });

    // create with unique code
    let code;
    let tries = 0;
    do {
      code = generateCode();
      // ensure uniqueness
      const check = await Referral.findOne({ code });
      if (!check) break;
      tries++;
    } while (tries < 5);

    const referral = new Referral({ code, deviceId, discount: 0.20 });
    await referral.save();
    return res.json({ code: referral.code, discount: referral.discount });
  } catch (err) {
    console.error('Referral create error', err);
    return res.status(500).json({ error: 'SERVER_ERROR' });
  }
});

// Validate a code
router.post('/validate', async (req, res) => {
  const { code } = req.body || {};
  if (!code) return res.status(400).json({ error: 'MISSING_CODE' });

  try {
    const ref = await Referral.findOne({ code });
    if (!ref) return res.json({ valid: false });

    const available = ref.redeemedCount < (ref.maxRedemptions || 1);
    return res.json({ valid: available, discount: ref.discount });
  } catch (err) {
    console.error('Referral validate error', err);
    return res.status(500).json({ error: 'SERVER_ERROR' });
  }
});

module.exports = { referralsRouter: router };
