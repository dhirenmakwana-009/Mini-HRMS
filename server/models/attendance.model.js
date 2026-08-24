import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
	organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
	user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
	date: { type: String, required: true },
	status: { type: String, enum: ["not_started", "working", "completed"], default: "not_started" },
	attendanceStatus: { type: String, enum: ["in_progress", "present", "half_day", "absent"], default: "in_progress" },
	isLate: { type: Boolean, default: false },
	policySnapshot: {
		timezone: String, workingDays: [Number], defaultShiftStart: String, defaultShiftEnd: String,
		lateGraceMinutes: Number, fullDayHours: Number, halfDayHours: Number, attendanceMode: String,
	},
	firstPunchIn: Date,
	lastPunchOut: Date,
	totalWorkedSeconds: { type: Number, default: 0, min: 0 },
	sessions: [{
		punchIn: { type: Date, required: true },
		punchOut: Date,
	}],
	logs: [{
		type: { type: String, enum: ["punch_in", "punch_out"], required: true },
		at: { type: Date, required: true },
	}],
}, { timestamps: true });

attendanceSchema.index({ organization: 1, user: 1, date: 1 }, { unique: true });

export const Attendance = mongoose.model("Attendance", attendanceSchema);
