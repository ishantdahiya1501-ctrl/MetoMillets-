const mongoose = require("mongoose");

const OrderItemSchema = new mongoose.Schema(
  {
    itemId: { type: String, required: true, trim: true, maxlength: 300 },
    productId: { type: String, required: true, trim: true, maxlength: 200 },
    name: { type: String, required: true, trim: true, maxlength: 300 },
    image: { type: String, default: "", trim: true, maxlength: 1000 },
    quantity: { type: Number, required: true, min: 1, max: 99 },
    price: { type: Number, required: true, min: 0, max: 1_000_000 },
  },
  { _id: false }
);

const CustomerSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 200 },
    email: { type: String, required: true, trim: true, maxlength: 200 },
    phone: { type: String, required: true, trim: true, maxlength: 50 },
    shippingAddress: { type: String, required: true, trim: true, maxlength: 2000 },
    instructions: { type: String, default: "", trim: true, maxlength: 2000 },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    orderNumber: { type: String, required: true, unique: true, index: true },

    customer: { type: CustomerSchema, required: true },
    items: { type: [OrderItemSchema], default: [] },

    subtotal: { type: Number, required: true, min: 0, max: 1_000_000 },
    shipping: { type: Number, required: true, min: 0, max: 1_000_000 },
    discount: { type: Number, required: true, min: 0, max: 1_000_000 },
    total: { type: Number, required: true, min: 0, max: 1_000_000 },
    referralCode: { type: String, default: "" },

    status: {
      type: String,
      required: true,
      enum: ["sent", "processing", "delivered", "pending"],
      // default 'pending' is a clearer name for new orders; keep 'sent' in the enum for backward compatibility
      default: "pending",
    },
    emailSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", OrderSchema);

module.exports = { Order };
