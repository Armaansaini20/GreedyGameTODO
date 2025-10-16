// scripts/create-super-mongo.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User").default || require("../models/User");

const uri = process.env.MONGODB_URI;
const email = (process.env.SEED_SUPER_EMAIL || process.env.SUPER_EMAIL || "").toLowerCase().trim();
const pw = process.env.SEED_SUPER_PW || process.env.SUPER_PW;

if (!uri || !email || !pw) {
  console.error("Set MONGODB_URI, SEED_SUPER_EMAIL and SEED_SUPER_PW in env");
  process.exit(1);
}

async function run() {
  await mongoose.connect(uri);
  const hashed = await bcrypt.hash(pw, 10);
  let user = await User.findOne({ email });
  if (user) {
    user.role = "SUPER";
    if (!user.password) user.password = hashed;
    await user.save();
    console.log("Updated existing super user:", email);
  } else {
    await User.create({ name: "Super Admin", email, password: hashed, role: "SUPER" });
    console.log("Created super user:", email);
  }
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
