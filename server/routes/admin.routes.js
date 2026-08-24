import { Router } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/user.model.js";
import { Attendance } from "../models/attendance.model.js";
import { Organization } from "../models/organization.model.js";
import { auth, requireRole } from "../middleware/auth.js";
import { dateInTimezone, defaultPolicy, policyFor, publicStatus } from "../src/utils/attendance.js";

const router = Router();
router.use(auth, requireRole("admin"));

router.get("/attendance-config", async (req, res, next) => {
  try { const organization = await Organization.findById(req.user.organization).lean(); return res.json({ config: policyFor(organization) }); } catch (error) { return next(error); }
});

router.put("/attendance-config", async (req, res, next) => {
  try {
    const input = req.body || {}; const config = { ...defaultPolicy, ...input };
    try { Intl.DateTimeFormat("en-US", { timeZone: config.timezone }); } catch { return res.status(400).json({ error: "Choose a valid IANA timezone" }); }
    if (!Array.isArray(config.workingDays) || !config.workingDays.length || config.workingDays.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) return res.status(400).json({ error: "Choose at least one valid working day" });
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(config.defaultShiftStart) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(config.defaultShiftEnd)) return res.status(400).json({ error: "Shift times must use HH:MM" });
    if (config.punchInRestriction === "shift_hours" && config.defaultShiftEnd <= config.defaultShiftStart) return res.status(400).json({ error: "Shift-only mode supports daytime shifts only; shift end must be after shift start" });
    if (!Number.isFinite(Number(config.halfDayHours)) || !Number.isFinite(Number(config.fullDayHours)) || Number(config.halfDayHours) <= 0 || Number(config.fullDayHours) < Number(config.halfDayHours)) return res.status(400).json({ error: "Full-day hours must be greater than or equal to half-day hours" });
    if (!Number.isFinite(Number(config.lateGraceMinutes)) || Number(config.lateGraceMinutes) < 0 || Number(config.lateGraceMinutes) > 240) return res.status(400).json({ error: "Late grace must be between 0 and 240 minutes" });
    const organization = await Organization.findByIdAndUpdate(req.user.organization, { $set: { attendanceMode: config.attendanceMode === "single_session" ? "single_session" : "multiple_sessions", attendanceConfig: { timezone: config.timezone, workingDays: [...new Set(config.workingDays)].sort(), defaultShiftStart: config.defaultShiftStart, defaultShiftEnd: config.defaultShiftEnd, lateGraceMinutes: Number(config.lateGraceMinutes), fullDayHours: Number(config.fullDayHours), halfDayHours: Number(config.halfDayHours), punchInRestriction: config.punchInRestriction === "shift_hours" ? "shift_hours" : "anytime" } } }, { new: true }).lean();
    return res.json({ config: policyFor(organization), message: "Attendance policy saved. It applies to future punch-ins only." });
  } catch (error) { return next(error); }
});

router.get("/employees", async (req, res, next) => {
  try {
    const [employees, organization] = await Promise.all([User.find({ organization: req.user.organization, role: "employee" }).select("-password -refreshTokenHash").sort({ name: 1 }).lean(), Organization.findById(req.user.organization).lean()]);
    const dates = employees.map((employee) => employee._id);
    const policy = policyFor(organization); const today = dateInTimezone(new Date(), policy.timezone);
    const since = new Date(); since.setDate(since.getDate() - 29);
    const attendance = await Attendance.find({ organization: req.user.organization, user: { $in: dates }, date: { $gte: dateInTimezone(since, policy.timezone), $lte: today } }).lean();
    const byUser = new Map(attendance.map((record) => [record.user.toString(), record]));
    const todayByUser = new Map(attendance.filter((r) => r.date === today).map((r) => [r.user.toString(), r]));
    const metrics = employees.map((employee) => publicEmployee(employee, todayByUser.get(employee._id.toString()), attendance.filter((r) => r.user.toString() === employee._id.toString())));
    const active = metrics.filter((e) => e.active), statuses = active.map((e) => e.todayStatus);
    return res.json({ employees: metrics, kpis: { total: metrics.length, active: active.length, present: statuses.filter((s) => s === "Present").length, halfDay: statuses.filter((s) => s === "Half Day").length, late: active.filter((e) => e.isLate).length, absent: statuses.filter((s) => s === "Absent").length, rate: active.length ? Math.round(statuses.filter((s) => s === "Present" || s === "Late" || s === "Half Day").length / active.length * 100) : 0 } });
  } catch (error) { return next(error); }
});

router.post("/employees", async (req, res, next) => {
  try {
    const {
      firstName, lastName, email, password, phone, department, designation,
      employmentType, joinDate, shiftStart, shiftEnd, confirmPassword,
    } = req.body || {};
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const errors = {};
    if (!String(firstName || "").trim()) errors.firstName = "First name is required";
    if (!String(lastName || "").trim()) errors.lastName = "Last name is required";
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) errors.email = "Enter a valid email";
    if (typeof password !== "string" || password.length < 8) errors.password = "Password must contain at least 8 characters";
    if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match";
    if (!String(phone || "").trim()) errors.phone = "Phone number is required";
    if (!String(department || "").trim()) errors.department = "Department is required";
    if (!String(designation || "").trim()) errors.designation = "Designation is required";
    if (!["Full-time", "Part-time", "Contract"].includes(employmentType)) errors.employmentType = "Invalid employment type";
    const parsedJoinDate = new Date(joinDate);
    if (!joinDate || Number.isNaN(parsedJoinDate.getTime())) errors.joinDate = "A valid joining date is required";
    if (Object.keys(errors).length) return res.status(400).json({ error: "Please correct the highlighted fields", fields: errors });
    if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ error: "An account with this email already exists", fields: { email: "Email is already in use" } });

    const user = await User.create({
      email: normalizedEmail,
      password: await bcrypt.hash(password, 12),
      name: `${String(firstName).trim()} ${String(lastName).trim()}`,
      role: "employee",
      organization: req.user.organization,
      phone: String(phone).trim(),
      department: String(department).trim(),
      designation: String(designation).trim(),
      employmentType,
      joinDate: parsedJoinDate,
      shiftStart,
      shiftEnd,
      isActive: true,
    });
    return res.status(201).json({ employee: publicEmployee(user) });
  } catch (error) { return next(error); }
});

router.get("/employees/:id/attendance", async (req, res, next) => {
  try {
    const employee = await User.findOne({ _id: req.params.id, organization: req.user.organization, role: "employee" }).select("-password -refreshTokenHash").lean();
    if (!employee) return res.status(404).json({ error: "Employee not found" });
    const filter = { user: employee._id, organization: req.user.organization }; if (req.query.from || req.query.to) filter.date = { ...(req.query.from ? { $gte: req.query.from } : {}), ...(req.query.to ? { $lte: req.query.to } : {}) };
    const records = await Attendance.find(filter).sort({ date: -1 }).lean(); const completed = records.filter((r) => r.status === "completed"), attended = completed.filter((r) => r.attendanceStatus !== "absent");
    return res.json({ employee: publicEmployee(employee), records: records.map((r) => ({ ...r, statusLabel: publicStatus(r) })), summary: { totalDays: completed.length, present: completed.filter((r) => r.attendanceStatus === "present").length, halfDay: completed.filter((r) => r.attendanceStatus === "half_day").length, absent: completed.filter((r) => r.attendanceStatus === "absent").length, late: records.filter((r) => r.isLate).length, totalWorkedSeconds: records.reduce((sum, r) => sum + (r.totalWorkedSeconds || 0), 0), attendanceRate: completed.length ? Math.round(attended.length / completed.length * 100) : 0 } });
  } catch (error) { return next(error); }
});

function publicEmployee(user, attendance, history = []) {
  const [firstName, ...lastParts] = user.name.split(" ");
  return {
    id: user._id,
    firstName,
    lastName: lastParts.join(" "),
    email: user.email,
    phone: user.phone || "",
    department: user.department || "",
    designation: user.designation || "",
    employmentType: user.employmentType,
    joinDate: user.joinDate,
    shiftStart: user.shiftStart,
    shiftEnd: user.shiftEnd,
    active: user.isActive,
    todayStatus: publicStatus(attendance), isLate: Boolean(attendance?.isLate),
    punchInTime: attendance?.firstPunchIn || null,
    attendanceRate: history.filter((r) => r.status === "completed").length ? Math.round(history.filter((r) => r.status === "completed" && r.attendanceStatus !== "absent").length / history.filter((r) => r.status === "completed").length * 100) : 0,
  };
}

export default router;
