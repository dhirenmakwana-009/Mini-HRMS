import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import connectDb from "../src/utils/db.js";
import { Organization } from "../models/organization.model.js";
import { User } from "../models/user.model.js";

const email = String(process.env.SEED_ADMIN_EMAIL || "admin@gmail.com").trim().toLowerCase();
const password = process.env.SEED_ADMIN_PASSWORD || "admin@123";
const name = process.env.SEED_ADMIN_NAME || "System Administrator";

if (!password || password.length < 8) {
  console.error("SEED_ADMIN_PASSWORD must be set and contain at least 8 characters");
  process.exit(1);
}

try {
  await connectDb();
  const organization = await Organization.findOneAndUpdate(
    { name: process.env.SEED_ORGANIZATION_NAME || "DM WebSoft" },
    { $setOnInsert: { name: process.env.SEED_ORGANIZATION_NAME || "DM WebSoft" } },
    { upsert: true, new: true },
  );
  const passwordHash = await bcrypt.hash(password, 12);
  await User.findOneAndUpdate(
    { email },
    { $set: { name, role: "admin", organization: organization._id, isActive: true, password: passwordHash } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  console.log(`Seeded admin ${email} in ${organization.name}`);
} finally {
  await mongoose.disconnect();
}