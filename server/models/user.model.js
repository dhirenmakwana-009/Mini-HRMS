import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false, minlength: 8 },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  role: { type: String, enum: ["admin", "employee"], default: "employee" },
  initials: { type: String, trim: true, maxlength: 4 },
  phone: { type: String, trim: true, maxlength: 30 },
  department: { type: String, trim: true, maxlength: 80 },
  designation: { type: String, trim: true, maxlength: 100 },
  employmentType: { type: String, enum: ["Full-time", "Part-time", "Contract"], default: "Full-time" },
  joinDate: Date,
  shiftStart: { type: String, default: "09:00" },
  shiftEnd: { type: String, default: "18:00" },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
  isActive: { type: Boolean, default: true },
  refreshTokenHash: { type: String, select: false },
}, { timestamps: true });

export const User = mongoose.model("User", userSchema);

