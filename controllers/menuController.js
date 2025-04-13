const Menu = require("../models/menuModel");

// ✅ Get Latest Menu (For Users Scanning QR)
const getMenu = async (req, res) => {
  try {
    const menu = await Menu.findOne();
    if (!menu) {
      return res.status(404).json({ success: false, message: "Menu not found" });
    }
    res.json({ success: true, menu });
  } catch (error) {
    console.error("❌ Error fetching menu:", error);
    res.status(500).json({ success: false, message: "Failed to fetch menu" });
  }
};

// ✅ Update Menu (Only Admins)
const updateMenu = async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, message: "Invalid menu format" });
    }

    let menu = await Menu.findOne();
    if (!menu) {
      menu = new Menu({ items });
    } else {
      menu.items = items;
      menu.lastUpdated = new Date();
    }

    await menu.save();
    res.json({ success: true, message: "Menu updated successfully", menu });
  } catch (error) {
    console.error("❌ Error updating menu:", error);
    res.status(500).json({ success: false, message: "Failed to update menu" });
  }
};

module.exports = { getMenu, updateMenu };
