const mongoose = require("mongoose");

const qrCodeSchema = new mongoose.Schema({
  tableNumber: { type: Number, required: true, unique: true },
  qrCodeUrl: { type: String, required: false },
  sessionId: { type: String, required: false, sparse: true },
  status: { type: String, required: true }, // occupied/vacant
  lastUpdated: { type: Date, default: Date.now },
  customerData: {
    customerIP: String,
    deviceOS: String,
    batteryPercentage: String,
    email: String,
  },
  previousTable: { type: Number, required: false }, // Store the previous table for tracking
});

const QrCode = mongoose.model("QrCode", qrCodeSchema);

module.exports = QrCode;
