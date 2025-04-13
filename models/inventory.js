const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  ingredientName: { type: String, required: true, unique: true },
  stockLevel: { type: Number, required: true }, // Current available stock
  reorderThreshold: { type: Number, required: true }, // When to trigger a restock alert
  lastRestocked: { type: Date, default: Date.now }
});

const Inventory = mongoose.model("Inventory", inventorySchema);
module.exports = Inventory;
