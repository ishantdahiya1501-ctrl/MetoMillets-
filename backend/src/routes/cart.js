const express = require("express");
const { z } = require("zod");

const { requireAuth } = require("../middleware/auth");
const { CartItem } = require("../models/CartItem");

const router = express.Router();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const setQuantitySchema = z.object({
  productId: z.string().trim().min(1).max(200),
  quantity: z.number().int().min(1).max(99),
});

/**
 * GET /api/cart
 * Returns current user's cart.
 */
router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const items = await CartItem.find({ userId: req.user._id }).sort({ updatedAt: -1 }).lean();
    return res.status(200).json({
      items: items.map((item) => ({
        id: String(item._id),
        productId: item.productId,
        quantity: item.quantity,
        updatedAt: item.updatedAt,
      })),
    });
  })
);

/**
 * PUT /api/cart
 * Body: { productId, quantity }
 * Upserts the cart item.
 */
router.put(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = setQuantitySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() });
    }

    const { productId, quantity } = parsed.data;

    const item = await CartItem.findOneAndUpdate(
      { userId: req.user._id, productId },
      { $set: { quantity } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      item: {
        id: String(item._id),
        productId: item.productId,
        quantity: item.quantity,
        updatedAt: item.updatedAt,
      },
    });
  })
);

/**
 * DELETE /api/cart/:productId
 */
router.delete(
  "/:productId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const productId = String(req.params.productId || "").trim();
    if (!productId) {
      return res.status(400).json({ error: "VALIDATION_ERROR" });
    }

    await CartItem.deleteOne({ userId: req.user._id, productId });
    return res.status(200).json({ ok: true });
  })
);

module.exports = { cartRouter: router };
