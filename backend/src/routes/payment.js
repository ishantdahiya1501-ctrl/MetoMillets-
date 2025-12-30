const express = require("express");
const { z } = require("zod");
const crypto = require("crypto");
const fs = require("fs").promises;
const path = require("path");

const router = express.Router();

const LOG_DIR = path.resolve(__dirname, "..", "logs");
const LOG_FILE = path.join(LOG_DIR, "payments.log");

const writePaymentLog = async (obj) => {
  try {
    await fs.mkdir(LOG_DIR, { recursive: true });
    const line = JSON.stringify({ ts: new Date().toISOString(), ...obj }) + "\n";
    await fs.appendFile(LOG_FILE, line, "utf8");
  } catch (err) {
    // Log to console but do not interrupt request handling
    console.error("Failed to write payment log", err);
  }
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Lazily require Razorpay to avoid crashes when package isn't installed during tests
const getRazorpayInstance = () => {
  // Use environment variables only
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error("RAZORPAY_KEYS_NOT_CONFIGURED");
  }
  // Require here so startup won't fail if package is missing in some environments
  const Razorpay = require("razorpay");
  return new Razorpay({ key_id, key_secret });
};

const createOrderSchema = z.object({
  // Accept numbers or numeric strings for convenience
  amount: z.preprocess((v) => (typeof v === "string" ? Number(v) : v), z.number().min(1)), // amount in rupees
});

const verifySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

/**
 * POST /api/payment/create-order
 * Body: { amount }
 */
router.post(
  "/create-order",
  asyncHandler(async (req, res) => {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      await writePaymentLog({ event: "create_order", status: "validation_failed", body: req.body });
      return res.status(400).json({ error: "VALIDATION_ERROR" });
    }

    const amountRupees = parsed.data.amount;
    // Convert to paise
    const amountPaise = Math.round(amountRupees * 100);

    let razorpay;
    try {
      razorpay = getRazorpayInstance();
    } catch (err) {
      console.error("Razorpay configuration error:", err?.message || err);
      await writePaymentLog({ event: "create_order", status: "keys_missing", amountRupees, amountPaise });
      return res.status(500).json({ error: "RAZORPAY_KEYS_NOT_CONFIGURED" });
    }

    const options = {
      amount: amountPaise,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      payment_capture: 1,
    };

    try {
      const order = await razorpay.orders.create(options);
      await writePaymentLog({
        event: "create_order",
        status: "created",
        amountRupees,
        amountPaise,
        receipt: options.receipt,
        orderId: order.id,
      });
      // Return order and public key_id (safe to expose) for client-side use
      return res.status(201).json({ order, key_id: process.env.RAZORPAY_KEY_ID || null });
    } catch (err) {
      // Log full error for operators, but return a safe, inspectable message to clients
      console.error("Razorpay order creation failed:", err);
      await writePaymentLog({
        event: "create_order",
        status: "failed",
        amountRupees,
        amountPaise,
        receipt: options.receipt,
        error: err?.message || String(err),
      });
      return res.status(502).json({ error: "ORDER_CREATION_FAILED", message: err.message || String(err) });
    }
  })
);

/**
 * POST /api/payment/verify
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
router.post(
  "/verify",
  asyncHandler(async (req, res) => {
    const parsed = verifySchema.safeParse(req.body);
    if (!parsed.success) {
      await writePaymentLog({ event: "verify", status: "validation_failed", body: req.body });
      return res.status(400).json({ success: false });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      await writePaymentLog({ event: "verify", status: "keys_missing", razorpay_order_id, razorpay_payment_id });
      throw new Error("RAZORPAY_KEYS_NOT_CONFIGURED");
    }

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex");

    // Use timingSafeEqual when comparing digests
    const a = Buffer.from(generatedSignature, "utf8");
    const b = Buffer.from(razorpay_signature, "utf8");

    let success = false;
    try {
      if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
        success = true;
      } else {
        success = false;
      }
    } catch (err) {
      // timingSafeEqual throws on unequal lengths; treat as failure
      success = false;
    }

    await writePaymentLog({
      event: "verify",
      razorpay_order_id,
      razorpay_payment_id,
      success,
    });

    return res.status(200).json({ success });
  })
);

module.exports = { paymentRouter: router };