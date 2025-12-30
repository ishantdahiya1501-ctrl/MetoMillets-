const express = require("express");
const { z } = require("zod");

const { requireAuth } = require("../middleware/auth");
const { Order } = require("../models/Order");
const Referral = require('../models/Referral');

const router = express.Router();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const orderItemSchema = z.object({
  itemId: z.string().trim().min(1).max(300),
  productId: z.string().trim().min(1).max(200),
  name: z.string().trim().min(1).max(300),
  image: z.string().trim().max(1000).optional().default(""),
  quantity: z.number().int().min(1).max(99),
  price: z.number().min(0).max(1_000_000),
});

const customerSchema = z.object({
  fullName: z.string().trim().min(1).max(200),
  email: z.string().trim().email().toLowerCase().max(200),
  phone: z.string().trim().min(1).max(50),
  shippingAddress: z.string().trim().min(1).max(2000),
  instructions: z.string().trim().max(2000).optional().default(""),
});

const createOrderSchema = z.object({
  customer: customerSchema,
  items: z.array(orderItemSchema).min(1).max(200),
  subtotal: z.number().min(0).max(1_000_000),
  shipping: z.number().min(0).max(1_000_000),
  discount: z.number().min(0).max(1_000_000).optional().default(0),
  total: z.number().min(0).max(1_000_000),
  referralCode: z.string().trim().max(100).optional(),
  status: z.enum(["sent", "processing", "delivered", "pending"]).optional().default("pending"),
  emailSent: z.boolean().optional().default(false),
});

const generateOrderNumber = () => {
  const rand = Math.random().toString(16).slice(2, 8).toUpperCase();
  return `ORD-${Date.now()}-${rand}`;
};

/**
 * POST /api/orders
 * Auth: create an order for the current user.
 */
router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() });
    }

    const orderNumber = generateOrderNumber();

    // If referral code was provided, validate and consume it atomically
    let consumedReferral = null;
    if (parsed.data.referralCode) {
      const code = parsed.data.referralCode;
      const ref = await Referral.findOne({ code });
      if (!ref) return res.status(400).json({ error: 'INVALID_REFERRAL' });

      // Attempt to increment redeemedCount only if under maxRedemptions
      const updatedRef = await Referral.findOneAndUpdate(
        { code, redeemedCount: { $lt: ref.maxRedemptions || 1 } },
        { $inc: { redeemedCount: 1 } },
        { new: true }
      );

      if (!updatedRef) return res.status(400).json({ error: 'REFERRAL_REDEEMED' });

      consumedReferral = updatedRef;

      // Recompute discount and total on server to prevent tampering
      const discountAmount = Math.round(parsed.data.subtotal * (consumedReferral.discount || 0));
      parsed.data.discount = discountAmount;
      parsed.data.total = parsed.data.subtotal + parsed.data.shipping - discountAmount;
    }

    try {
      const created = await Order.create({
        userId: req.user._id,
        orderNumber,
        ...parsed.data,
      });

      return res.status(201).json({
        order: {
          id: String(created._id),
          orderNumber: created.orderNumber,
          itemsCount: created.items.length,
          subtotal: created.subtotal,
          shipping: created.shipping,
          discount: created.discount,
          total: created.total,
          status: created.status,
          createdAt: created.createdAt,
        },
      });
    } catch (err) {
      // rollback referral consumption if order creation failed
      if (consumedReferral) {
        try {
          await Referral.findOneAndUpdate({ code: consumedReferral.code }, { $inc: { redeemedCount: -1 } });
        } catch (rollbackErr) {
          console.error('Failed to rollback referral consumption', rollbackErr);
        }
      }
      throw err;
    }
  })
);

/**
 * POST /api/orders/guest
 * Public: create an order for guests (no authentication required)
 */
router.post(
  "/guest",
  asyncHandler(async (req, res) => {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() });
    }

    const orderNumber = generateOrderNumber();

    // If referral code was provided, validate and consume it atomically
    let consumedReferral = null;
    if (parsed.data.referralCode) {
      const code = parsed.data.referralCode;
      const ref = await Referral.findOne({ code });
      if (!ref) return res.status(400).json({ error: 'INVALID_REFERRAL' });

      const updatedRef = await Referral.findOneAndUpdate(
        { code, redeemedCount: { $lt: ref.maxRedemptions || 1 } },
        { $inc: { redeemedCount: 1 } },
        { new: true }
      );

      if (!updatedRef) return res.status(400).json({ error: 'REFERRAL_REDEEMED' });

      consumedReferral = updatedRef;

      // Recompute discount and total on server to prevent tampering
      const discountAmount = Math.round(parsed.data.subtotal * (consumedReferral.discount || 0));
      parsed.data.discount = discountAmount;
      parsed.data.total = parsed.data.subtotal + parsed.data.shipping - discountAmount;
    }

    try {
      const created = await Order.create({
        orderNumber,
        ...parsed.data,
      });

      return res.status(201).json({
        order: {
          id: String(created._id),
          orderNumber: created.orderNumber,
          itemsCount: created.items.length,
          subtotal: created.subtotal,
          shipping: created.shipping,
          discount: created.discount,
          total: created.total,
          status: created.status,
          createdAt: created.createdAt,
        },
      });
    } catch (err) {
      if (consumedReferral) {
        try {
          await Referral.findOneAndUpdate({ code: consumedReferral.code }, { $inc: { redeemedCount: -1 } });
        } catch (rollbackErr) {
          console.error('Failed to rollback referral consumption', rollbackErr);
        }
      }
      throw err;
    }
  })
);

/**
 * GET /api/orders/mine
 * Auth: list current user's orders.
 */
router.get(
  "/mine",
  requireAuth,
  asyncHandler(async (req, res) => {
    const orders = await Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.status(200).json({
      orders: orders.map((o) => ({
        id: String(o._id),
        orderNumber: o.orderNumber,
        items: Array.isArray(o.items) ? o.items : [],
        itemsCount: Array.isArray(o.items) ? o.items.length : 0,
        subtotal: o.subtotal,
        shipping: o.shipping,
        discount: o.discount,
        total: o.total,
        // normalize legacy 'sent' -> 'pending' for consistency in client UI
        status: (o.status === 'sent' ? 'pending' : o.status),
        createdAt: o.createdAt,
        date: o.createdAt,
      })),
    });
  })
);

// Admin: list all orders
router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    // TODO: Add role check if you add roles to User model later
    const orders = await Order.find({}).sort({ createdAt: -1 }).limit(500).lean();
    return res.status(200).json({ orders: orders.map(o => ({ id: String(o._id), orderNumber: o.orderNumber, customer: o.customer, items: Array.isArray(o.items) ? o.items : [], subtotal: o.subtotal, shipping: o.shipping, discount: o.discount, total: o.total, // normalize legacy 'sent' -> 'pending' for consistency
        status: (o.status === 'sent' ? 'pending' : o.status), createdAt: o.createdAt })) });
  })
);

// Admin: update an order (e.g., change status)
router.put(
  "/:orderId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const orderId = String(req.params.orderId || "").trim();
    if (!orderId) return res.status(400).json({ error: "VALIDATION_ERROR" });

    const update = {};
    if (req.body.status) update.status = String(req.body.status).trim();
    if (typeof req.body.emailSent === 'boolean') update.emailSent = req.body.emailSent;

    const allowedStatuses = ["sent", "processing", "delivered", "pending"];
    if (update.status && !allowedStatuses.includes(update.status)) return res.status(400).json({ error: "INVALID_STATUS" });

    const updated = await Order.findByIdAndUpdate(orderId, { $set: update }, { new: true }).lean();
    if (!updated) return res.status(404).json({ error: "NOT_FOUND" });

    return res.status(200).json({ order: { id: String(updated._id), orderNumber: updated.orderNumber, status: updated.status, emailSent: updated.emailSent, total: updated.total } });
  })
);

// Admin: delete an order
router.delete(
  "/:orderId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const orderId = String(req.params.orderId || "").trim();
    if (!orderId) return res.status(400).json({ error: "VALIDATION_ERROR" });

    await Order.findByIdAndDelete(orderId);
    return res.status(200).json({ ok: true });
  })
);

module.exports = { ordersRouter: router };
