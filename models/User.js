// models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, index: true },
  password: String, // hashed for credentials auth
  role: { type: String, enum: ["USER", "SUPER"], default: "USER" },
  image: String,
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", UserSchema);
