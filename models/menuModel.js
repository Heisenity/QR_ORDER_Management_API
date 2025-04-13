const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema({
  items: [
    {
      name: { type: String, required: true },
      price: { type: Number, required: true },
      description: { type: String },
      category: { type: String },
      available: { type: Boolean, default: true }
    }
  ],
  lastUpdated: {
    type: String,
    default: () => {
      return new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour12: true,
      });
    },
  },
  
});

const Menu = mongoose.model("Menu", menuSchema);
module.exports = Menu;
