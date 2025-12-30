const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: "User" },
    productId: { type: String, required: true, trim: true, minlength: 1, maxlength: 200 },
    quantity: { type: Number, required: true, min: 1, max: 99 },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

cartItemSchema.index({ userId: 1, productId: 1 }, { unique: true });

const CartItem = mongoose.model("CartItem", cartItemSchema);

module.exports = { CartItem };
