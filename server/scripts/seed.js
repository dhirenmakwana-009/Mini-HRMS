import "dotenv/config";
import mongoose from "mongoose";
import connectDb from "../src/utils/db.js";
import { ensureDefaultAdmin } from "../src/utils/ensureDefaultAdmin.js";

try {
  await connectDb();
  const result = await ensureDefaultAdmin();
  console.log(`${result.created ? "Created" : "Found existing"} admin ${result.email}`);
} finally {
  await mongoose.disconnect();
}