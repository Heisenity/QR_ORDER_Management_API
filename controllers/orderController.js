const Order = require("../models/order");
const QrCode = require("../models/qrCode");

// ✅ Create a new order
const createOrder = async (req, res) => {
  try {
    const { tableNumber, items, totalAmount } = req.body;

    if (!tableNumber || !items || !totalAmount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newOrder = new Order({ tableNumber, items, totalAmount, status: "pending" });
    await newOrder.save();

    // NEW: Emit "orderPlaced" event for real-time notification
    req.app.locals.io.emit("orderPlaced", {
      orderId: newOrder._id,
      status: newOrder.status,
      tableNumber: newOrder.tableNumber,
      totalAmount: newOrder.totalAmount
    });

    res.status(201).json({ message: "Order placed successfully", order: newOrder });
  } catch (error) {
    console.error("❌ Error creating order:", error.message);
    res.status(500).json({ error: "Server Error" });
  }
};

// ✅ Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Order status is required" });
    }

    const updatedOrder = await Order.findByIdAndUpdate(orderId, { status }, { new: true });

    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    // NEW: Emit "orderStatusUpdated" event for real-time notification
    req.app.locals.io.emit("orderStatusUpdated", {
      orderId: updatedOrder._id,
      status: updatedOrder.status,
      updatedAt: updatedOrder.updatedAt
    });

    res.json({ message: "Order status updated", order: updatedOrder });
  } catch (error) {
    console.error("❌ Error updating order status:", error.message);
    res.status(500).json({ error: "Server Error" });
  }
};

// ✅ Get order details by ID
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("❌ Error fetching order:", error.message);
    res.status(500).json({ error: "Server Error" });
  }
};

// ✅ Get all occupied tables
const getOccupiedTables = async (req, res) => {
  try {
    const occupiedTables = await QrCode.find({ status: "occupied" });

    if (occupiedTables.length === 0) {
      return res.status(404).json({ message: "No occupied tables found" });
    }

    res.json(occupiedTables);
  } catch (error) {
    console.error("❌ Error fetching occupied tables:", error.message);
    res.status(500).json({ error: "Server Error" });
  }
};

// ✅ Delete all tables
const deleteAllTables = async (req, res) => {
  try {
    await QrCode.deleteMany({});
    res.json({ message: "All tables deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting tables:", error.message);
    res.status(500).json({ error: "Server Error" });
  }
};

module.exports = {
  createOrder,
  updateOrderStatus,
  getOrderById,
  getOccupiedTables,
  deleteAllTables,
};
