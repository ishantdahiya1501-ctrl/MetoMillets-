const express = require("express");
const { z } = require("zod");

const { requireAuth } = require("../middleware/auth");
const { WishlistItem } = require("../models/WishlistItem");

const router = express.Router();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const upsertSchema = z.object({
  productId: z.string().trim().min(1).max(200),
});

/**
 * GET /api/wishlist
 * Returns current user's wishlist.
 */
router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const items = await WishlistItem.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      items: items.map((item) => ({
        id: String(item._id),
        productId: item.productId,
        createdAt: item.createdAt,
      })),
    });
  })
);

/**
 * POST /api/wishlist
 * Body: { productId }
 */
router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = upsertSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() });
    }

    const { productId } = parsed.data;

    try {
      const created = await WishlistItem.create({ userId: req.user._id, productId });
      return res.status(201).json({
        item: { id: String(created._id), productId: created.productId, createdAt: created.createdAt },
      });
    } catch (err) {
      // Duplicate (already in wishlist)
      if (err?.code === 11000) {
        const existing = await WishlistItem.findOne({ userId: req.user._id, productId }).lean();
        return res.status(200).json({
          item: {
            id: String(existing._id),
            productId: existing.productId,
            createdAt: existing.createdAt,
          },
        });
      }
      throw err;
    }
  })
);

/**
 * DELETE /api/wishlist/:productId
 */
router.delete(
  "/:productId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const productId = String(req.params.productId || "").trim();
    if (!productId) {
      return res.status(400).json({ error: "VALIDATION_ERROR" });
    }

    await WishlistItem.deleteOne({ userId: req.user._id, productId });
    return res.status(200).json({ ok: true });
  })
);

module.exports = { wishlistRouter: router };
