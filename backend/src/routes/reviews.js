const express = require("express");
const { z } = require("zod");

const { requireAuth } = require("../middleware/auth");
const { Review } = require("../models/Review");

const router = express.Router();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const createOrUpdateSchema = z.object({
  productId: z.string().trim().min(1).max(200),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional().default(""),
  body: z.string().trim().max(2000).optional().default(""),
});

/**
 * GET /api/reviews?productId=...
 * Public: list reviews for a product.
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const productId = String(req.query.productId || "").trim();
    if (!productId) {
      return res.status(400).json({ error: "VALIDATION_ERROR" });
    }

    const reviews = await Review.find({ productId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.status(200).json({
      reviews: reviews.map((r) => ({
        id: String(r._id),
        productId: r.productId,
        rating: r.rating,
        title: r.title,
        body: r.body,
        userName: r.userNameSnapshot || "",
        createdAt: r.createdAt,
      })),
    });
  })
);

/**
 * GET /api/reviews/all
 * Public: list recent reviews across all products.
 */
router.get(
  "/all",
  asyncHandler(async (req, res) => {
    const reviews = await Review.find({})
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    return res.status(200).json({
      reviews: reviews.map((r) => ({
        id: String(r._id),
        productId: r.productId,
        rating: r.rating,
        title: r.title,
        body: r.body,
        userName: r.userNameSnapshot || "",
        createdAt: r.createdAt,
      })),
    });
  })
);

/**
 * GET /api/reviews/mine
 * Auth: list current user's reviews.
 */
router.get(
  "/mine",
  requireAuth,
  asyncHandler(async (req, res) => {
    const reviews = await Review.find({ userId: req.user._id }).sort({ updatedAt: -1 }).lean();

    return res.status(200).json({
      reviews: reviews.map((r) => ({
        id: String(r._id),
        productId: r.productId,
        rating: r.rating,
        title: r.title,
        body: r.body,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    });
  })
);

/**
 * POST /api/reviews
 * Auth: create/update current user's review for a product.
 * Body: { productId, rating, title?, body? }
 */
router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = createOrUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() });
    }

    const { productId, rating, title, body } = parsed.data;

    const review = await Review.findOneAndUpdate(
      { userId: req.user._id, productId },
      {
        $set: {
          rating,
          title,
          body,
          userNameSnapshot: req.user.name || "",
        },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      review: {
        id: String(review._id),
        productId: review.productId,
        rating: review.rating,
        title: review.title,
        body: review.body,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      },
    });
  })
);

/**
 * DELETE /api/reviews/:productId
 * Auth: delete current user's review for a product.
 */
router.delete(
  "/:productId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const productId = String(req.params.productId || "").trim();
    if (!productId) {
      return res.status(400).json({ error: "VALIDATION_ERROR" });
    }

    await Review.deleteOne({ userId: req.user._id, productId });
    return res.status(200).json({ ok: true });
  })
);

module.exports = { reviewsRouter: router };
