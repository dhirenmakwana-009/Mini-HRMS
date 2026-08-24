import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  attendanceMode: { type: String, enum: ["single_session", "multiple_sessions"], default: "multiple_sessions" },
}, { timestamps: true });

export const Organization = mongoose.model("Organization", organizationSchema);