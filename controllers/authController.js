const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/user");

// ✅ User Registration (No Token Required)
const signUp = async (req, res) => {
  try {
    console.log("Bcrypt Module:", bcrypt); // Debugging

    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
        return res.status(400).json({ 
          success: false, 
          message: `Missing required field(s): ${!username ? 'username' : ''} ${!email ? 'email' : ''} ${!password ? 'password' : ''} ${!role ? 'role' : ''}`.trim().replace(/\s+/g, ', ') 
        });
      }
      
    

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    // Hash password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role,
    });

    await newUser.save();
    res.status(201).json({ success: true, message: "User registered successfully" });
  } catch (error) {
    console.error("Registration Error:", error); // Debugging
    res.status(500).json({ success: false, message: "Registration failed", error: error.message });
  }
};

// ✅ User Login
const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    // Generate JWT token for authentication
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "5h" }
    );

    res.status(200).json({ success: true, message: "Login successful", token });
  } catch (error) {
    console.error("Login Error:", error); // Debugging
    res.status(500).json({ success: false, message: "Login failed", error: error.message });
  }
};

module.exports = { signUp, signIn };
