const express = require("express");
const { signUp, signIn } = require("../controllers/authController");
const { authenticate, authorizeAdmin } = require("../middleware/authMiddleware");

const router = express.Router();


router.post("/register", signUp);

//Login User
router.post("/login", signIn);

module.exports = router;
