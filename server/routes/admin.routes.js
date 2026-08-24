import { Router } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/user.model.js";
import { Attendance } from "../models/attendance.model.js";
import { auth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/employees", auth, requireRole("admin"), async (req, res, next) => {
  try {
    const employees = await User.find({ organization: req.user.organization, role: "employee" }).select("-password -refreshTokenHash").sort({ name: 1 }).lean();
    const dates = employees.map((employee) => employee._id);
    const today = new Date().toISOString().slice(0, 10);
    const attendance = await Attendance.find({ organization: req.user.organization, user: { $in: dates }, date: today }).lean();
    const byUser = new Map(attendance.map((record) => [record.user.toString(), record]));
    return res.json({ employees: employees.map((employee) => publicEmployee(employee, byUser.get(employee._id.toString()))) });
  } catch (error) { return next(error); }
});

router.post("/employees", auth, requireRole("admin"), async (req, res, next) => {
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

function publicEmployee(user, attendance) {
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
    todayStatus: attendance?.status === "working" ? "Present" : "Absent",
    punchInTime: attendance?.firstPunchIn || null,
    attendanceRate: null,
  };
}

export default router;