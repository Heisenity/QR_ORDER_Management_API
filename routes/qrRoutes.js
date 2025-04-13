const express = require("express");
const router = express.Router();
const QrCode = require("../models/qrCode");
const Order = require("../models/order"); // Import the Order model
const { authenticate, authorizeAdmin } = require("../middleware/authMiddleware");

// ✅ Admin can generate a QR code for a table
router.post("/generate", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { tableNumber } = req.body;

    if (!tableNumber) {
      return res.status(400).json({ error: "Table number is required" });
    }

    // Check if QR code already exists
    const existingQrCode = await QrCode.findOne({ tableNumber });
    if (existingQrCode) {
      return res.status(400).json({ error: "QR Code already exists for this table" });
    }

    // Create new QR Code
    const newQrCode = new QrCode({ tableNumber, status: "available" });
    await newQrCode.save();

    res.status(201).json({ message: "QR Code generated successfully", qrCode: newQrCode });
  } catch (error) {
    console.error("❌ Error generating QR Code:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Scan QR Code (Mark Table as Occupied)
router.post("/scan", async (req, res) => {
    try {
      const { tableNumber } = req.body;
  
      if (!tableNumber) {
        return res.status(400).json({ error: "Table number is required" });
      }
  
      let qrEntry = await QrCode.findOne({ tableNumber });
  
      if (!qrEntry) {
        return res.status(404).json({ error: "Table not found" });
      }
  
      if (qrEntry.status === "occupied") {
        return res.status(400).json({ error: "Table is already occupied" });
      }
  
      // ✅ Auto-generate session ID
      const sessionId = `session-${tableNumber}-${Date.now()}`;
  
      // ✅ Mark table as occupied (customer email will be added during payment)
      qrEntry.status = "occupied";
      qrEntry.sessionId = sessionId;
      await qrEntry.save();
  
      res.status(200).json({
        message: `Table ${tableNumber} is now occupied.`,
        tableNumber,
        sessionId,
        status: "occupied"
      });
    } catch (error) {
      console.error("❌ Error scanning QR Code:", error.message);
      res.status(500).json({ error: "Server Error" });
    }
  });
  

// ✅ Auto-transfer session + orders when scanning a new QR code
router.post("/scan-table", authenticate, async (req, res) => {
  try {
    const { tableNumber, sessionId } = req.body;

    if (!tableNumber || !sessionId) {
      return res.status(400).json({ error: "Table number and session ID are required" });
    }

    // Find current session data
    const previousTableData = await QrCode.findOne({ sessionId });

    if (previousTableData) {
      const previousTable = previousTableData.tableNumber;

      // If scanning the same table, do nothing
      if (previousTable === tableNumber) {
        return res.json({ message: `Already assigned to Table ${tableNumber}` });
      }

      // ✅ Transfer session & customer data to the new table
      await QrCode.updateOne(
        { tableNumber },
        { sessionId, status: "occupied", customerData: previousTableData.customerData, lastUpdated: Date.now() },
        { upsert: true }
      );

      // ✅ Mark the old table as "available"
      await QrCode.updateOne(
        { tableNumber: previousTable },
        { sessionId: null, status: "available", lastUpdated: Date.now() }
      );

      // ✅ Transfer Orders to the New Table
      await Order.updateMany(
        { sessionId }, // Find orders linked to the session
        { tableNumber } // Update orders to the new table
      );

      return res.json({ message: `Session moved from Table ${previousTable} to Table ${tableNumber}. Orders also transferred.` });
    }

    res.status(400).json({ error: "No active session found to transfer" });

  } catch (error) {
    console.error("❌ Error in auto-session handoff:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Mark Table as Available
router.put("/mark-available", authenticate, async (req, res) => {
  try {
    const { tableNumber } = req.body;

    if (!tableNumber) {
      return res.status(400).json({ error: "Table number is required" });
    }

    const qrEntry = await QrCode.findOne({ tableNumber });

    if (!qrEntry) {
      return res.status(404).json({ error: "Table not found" });
    }

    qrEntry.status = "available";
    qrEntry.sessionId = null;
    qrEntry.customerData = null;
    await qrEntry.save();

    res.status(200).json({ message: `Table ${tableNumber} is now available.` });
  } catch (error) {
    console.error("❌ Error marking table as available:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Get QR Details (Logged-in Users)
router.get("/:tableNumber", authenticate, async (req, res) => {
  try {
    const { tableNumber } = req.params;

    const qrEntry = await QrCode.findOne({ tableNumber });

    if (!qrEntry) {
      return res.status(404).json({ error: "QR Code not found" });
    }

    res.status(200).json(qrEntry);
  } catch (error) {
    console.error("❌ Error fetching QR details:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Delete QR Code (Admins Only)
router.delete("/:tableNumber", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { tableNumber } = req.params;

    const qrEntry = await QrCode.findOneAndDelete({ tableNumber });

    if (!qrEntry) {
      return res.status(404).json({ error: "QR Code not found" });
    }

    res.status(200).json({ message: `QR Code for Table ${tableNumber} deleted.` });
  } catch (error) {
    console.error("❌ Error deleting QR Code:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
