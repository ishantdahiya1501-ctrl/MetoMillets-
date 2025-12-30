const mongoose = require("mongoose");

const wishlistItemSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: "User" },
    productId: { type: String, required: true, trim: true, minlength: 1, maxlength: 200 },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

wishlistItemSchema.index({ userId: 1, productId: 1 }, { unique: true });

const WishlistItem = mongoose.model("WishlistItem", wishlistItemSchema);

module.exports = { WishlistItem };
