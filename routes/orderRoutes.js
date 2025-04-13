const express = require("express");
const router = express.Router();
const { createOrder, updateOrderStatus, getOrderById } = require("../controllers/orderController");
const { authenticate } = require("../middleware/authMiddleware");
const QrCode = require("../models/qrCode"); // Import the QR Code model

// Place a new order (authenticated users)
router.post("/", createOrder);

// Update order status (authenticated users; consider adding role-based restriction if needed)
router.put("/:orderId/status", updateOrderStatus);

// Get order details by order ID (authenticated users)
router.get("/:orderId", getOrderById);

// ✅ Get all occupied tables
router.get("/tables/occupied", async (req, res) => {
  try {
    const occupiedTables = await QrCode.find({ status: "occupied" });
    res.json({ occupiedTables });
  } catch (error) {
    console.error("❌ Error fetching occupied tables:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Delete all tables
router.delete("/tables/delete", async (req, res) => {
  try {
    await QrCode.deleteMany({});
    res.json({ message: "All tables deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting tables:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
