import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  attendanceMode: { type: String, enum: ["single_session", "multiple_sessions"], default: "multiple_sessions" },
  attendanceConfig: {
    timezone: { type: String, default: "Asia/Kolkata" },
    workingDays: { type: [Number], default: [1, 2, 3, 4, 5] },
    defaultShiftStart: { type: String, default: "09:00" },
    defaultShiftEnd: { type: String, default: "18:00" },
    lateGraceMinutes: { type: Number, default: 15, min: 0, max: 240 },
    fullDayHours: { type: Number, default: 8, min: 0.5, max: 24 },
    halfDayHours: { type: Number, default: 4, min: 0.25, max: 24 },
    punchInRestriction: { type: String, enum: ["anytime", "shift_hours"], default: "anytime" },
  },
}, { timestamps: true });

export const Organization = mongoose.model("Organization", organizationSchema);
