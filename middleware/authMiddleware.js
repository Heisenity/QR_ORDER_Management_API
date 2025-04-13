const jwt = require("jsonwebtoken");

// ✅ Middleware: Verify JWT Token
const authenticate = (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ success: false, message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
    req.user = decoded; // Attach user details to request
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid token." });
  }
};

// ✅ Middleware: Allow Only Admins
const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Access denied. Admins only." });
  }
  next();
};

module.exports = { authenticate, authorizeAdmin };
