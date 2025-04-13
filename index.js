require("dotenv").config(); // Load environment variables
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const http = require("http");
const socketIO = require("socket.io");
const bodyParser = require("body-parser");


// Import Routes
const qrRoutes = require("./routes/qrRoutes");
const menuRoutes = require("./routes/menuRoutes");
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");

// Import Models
require("./models/qrCode");
const QrCode = require("./models/qrCode");

const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/qrCodes", express.static(path.join(__dirname, "/images")));
app.use("/api/inventory", inventoryRoutes);

// ✅ MongoDB Connection with Better Error Handling
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1); // Exit the process if MongoDB connection fails
  }
};
connectDB();

// ✅ Define API Routes
app.use("/api/qr", qrRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);

// ✅ Function to get user IP
const getUserIP = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] || req.connection?.remoteAddress || "Unknown"
  );
};

// ✅ API Endpoint to store user data in QrCode model
app.post("/api/save-user", async (req, res) => {
  try {
    const { email, batteryPercentage, deviceOS, tableNumber } = req.body;
    const ip = getUserIP(req);

    if (!email || !deviceOS || !tableNumber) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const qrEntry = await QrCode.findOne({ tableNumber });

    if (!qrEntry) {
      return res.status(404).json({ error: "Table not found" });
    }

    qrEntry.customerData = { email, ip, deviceOS, batteryPercentage };
    await qrEntry.save();

    // Emit event to notify the frontend
    io.emit("userDataUpdated", { tableNumber, email, ip, deviceOS, batteryPercentage });

    res.status(201).json({ message: "User data saved successfully" });
  } catch (error) {
    console.error("❌ Error in /api/save-user:", error.message);
    res.status(500).json({ error: "Server Error" });
  }
});

// ✅ GET all occupied tables
app.get("/api/tables/occupied", async (req, res) => {
  try {
    const occupiedTables = await QrCode.find({ status: "occupied" });
    res.json(occupiedTables);
  } catch (error) {
    console.error("❌ Error fetching occupied tables:", error.message);
    res.status(500).json({ error: "Server Error" });
  }
});

// ✅ DELETE all tables
app.delete("/api/tables", async (req, res) => {
  try {
    await QrCode.deleteMany({});
    res.json({ message: "All tables deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting tables:", error.message);
    res.status(500).json({ error: "Server Error" });
  }
});

// Testing
app.get("/", (req, res) => {
  res.send("🎉 QR Order Management API is Live!");
});

// ✅ Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = socketIO(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

app.locals.io = io;

io.on("connection", (socket) => {
  console.log("A client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// ✅ Start the Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
