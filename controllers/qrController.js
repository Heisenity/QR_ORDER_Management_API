const QRCode = require("qrcode"); 
const fs = require("fs");
const path = require("path");
const QrCode = require("../models/qrCode");
const Order = require("../models/order");
const { authenticate, authorizeAdmin } = require("../middleware/authMiddleware");

// ✅ Ensure 'images' folder exists in the root directory
const qrCodesFolder = path.join(__dirname, "../images");
if (!fs.existsSync(qrCodesFolder)) {
  fs.mkdirSync(qrCodesFolder, { recursive: true });
}

// ✅ Generate a Static QR Code (One-time per table)
const generateStaticQR = async (req, res) => {
  try {
    const { tableNumber } = req.body;
    if (!tableNumber) {
      return res.status(400).json({ success: false, message: "Table number is required" });
    }

    let table = await QrCode.findOne({ tableNumber });

    if (!table) {
      const qrUrl = `http://localhost:3000/order/${tableNumber}`;
      const qrCodePath = path.join(qrCodesFolder, `table-${tableNumber}.png`);

      // ✅ Generate and Save QR Code as PNG
      await QRCode.toFile(qrCodePath, qrUrl, { type: "png" });

      table = new QrCode({
        tableNumber,
        qrCodeImage: `/images/table-${tableNumber}.png`,
        status: "available",
        lastUpdated: new Date(),
      });

      await table.save();
    }

    res.status(201).json({
      success: true,
      message: "QR Code generated successfully",
      data: { 
        tableNumber, 
        qrCodeImage: table.qrCodeImage 
      },
    });
      
  } catch (error) {
    console.error("❌ Error generating QR Code:", error);
    res.status(500).json({ success: false, message: "Failed to generate QR Code" });
  }
};

// ✅ Scan QR Code (Customers mark table as occupied)
const scanQR = async (req, res) => {
  try {
    const { tableNumber, customerIP, phoneOS, batteryPercentage, email } = req.body;
    if (!tableNumber) {
      return res.status(400).json({ success: false, message: "Table number is required" });
    }

    let table = await QrCode.findOne({ tableNumber });

    if (!table) {
      return res.status(404).json({ success: false, message: "QR Code not found" });
    }

    if (table.status === "occupied") {
      return res.status(400).json({ success: false, message: "Table is already occupied" });
    }

    table.sessionId = Date.now().toString();
    table.status = "occupied";
    table.estimatedVacantTime = new Date(Date.now() + 45 * 60000);
    table.lastUpdated = new Date();
    table.customerData = { customerIP, phoneOS, batteryPercentage, email };

    await table.save();

    res.json({
      success: true,
      message: "QR Code scanned successfully",
      data: { tableNumber, sessionId: table.sessionId, estimatedVacantTime: table.estimatedVacantTime },
    });
  } catch (error) {
    console.error("❌ Error scanning QR:", error);
    res.status(500).json({ success: false, message: "Failed to scan QR Code" });
  }
};

// ✅ Auto-transfer session + orders when scanning a new QR code
const transferSession = async (req, res) => {
  try {
    const { tableNumber, sessionId } = req.body;

    if (!tableNumber || !sessionId) {
      return res.status(400).json({ error: "Table number and session ID are required" });
    }

    const previousTableData = await QrCode.findOne({ sessionId });

    if (previousTableData) {
      const previousTable = previousTableData.tableNumber;

      if (previousTable === tableNumber) {
        return res.json({ message: `Already assigned to Table ${tableNumber}` });
      }

      await QrCode.updateOne(
        { tableNumber },
        { sessionId, status: "occupied", customerData: previousTableData.customerData, lastUpdated: Date.now() },
        { upsert: true }
      );

      await QrCode.updateOne(
        { tableNumber: previousTable },
        { sessionId: null, status: "available", lastUpdated: Date.now() }
      );

      await Order.updateMany(
        { sessionId },
        { tableNumber }
      );

      return res.json({ message: `Session moved from Table ${previousTable} to Table ${tableNumber}. Orders also transferred.` });
    }

    res.status(400).json({ error: "No active session found to transfer" });

  } catch (error) {
    console.error("❌ Error in auto-session handoff:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Mark Table as Available
const markTableAvailable = async (req, res) => {
  try {
    const { tableNumber } = req.body;

    if (!tableNumber) {
      return res.status(400).json({ success: false, message: "Table number is required" });
    }

    const table = await QrCode.findOne({ tableNumber });

    if (!table) {
      return res.status(404).json({ success: false, message: "Table not found" });
    }

    table.status = "available";
    table.sessionId = null;
    table.customerData = null;
    await table.save();

    res.status(200).json({ message: `Table ${tableNumber} is now available.` });
  } catch (error) {
    console.error("❌ Error marking table as available:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Export Functions
module.exports = {
  generateStaticQR,
  scanQR,
  transferSession,
  markTableAvailable,
};
