
const mongoose = require("mongoose"); // Import Mongoose

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "staff"], default: "staff" }, // Admin & Staff roles
});

module.exports = mongoose.model("User", UserSchema);
