const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  itemId: { type: String, required: true },   // Reference to a menu item ID, if needed
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true }
});

const orderSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true }, // 🔥 Added session tracking
    tableNumber: { type: Number, required: true },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "preparing", "completed", "cancelled"],
      default: "pending"
    }
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
