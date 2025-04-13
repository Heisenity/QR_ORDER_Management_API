const express = require("express");
const router = express.Router();
const { getMenu, updateMenu } = require("../controllers/menuController");
const adminMiddleware = require("../middleware/adminMiddleware"); // ✅ Protect update route
const authMiddleware = require("../middleware/adminMiddleware");

// ✅ Public route for users scanning the QR
router.get("/", getMenu);

// ✅ Admin route for updating the menu
router.put("/update", authMiddleware, updateMenu);

module.exports = router;
