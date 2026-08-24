import { Router } from "express";
import { Attendance } from "../models/attendance.model.js";
import { auth } from "../middleware/auth.js";

const router = Router();
const today = () => new Date().toISOString().slice(0, 10);
const serialized = (record) => record || { date: today(), status: "not_started", totalWorkedSeconds: 0, sessions: [], logs: [] };

router.use(auth);

router.get("/summary", async (req, res, next) => {
  try {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const weekStart = new Date(now);
    const day = weekStart.getUTCDay() || 7;
    weekStart.setUTCDate(weekStart.getUTCDate() - day + 1);
    const monthStart = new Date(now);
    monthStart.setUTCDate(monthStart.getUTCDate() - 29);
    const records = await Attendance.find({ user: req.user._id, date: { $gte: monthStart.toISOString().slice(0, 10), $lte: today } }).sort({ date: 1 }).lean();
    const byDate = new Map(records.map((record) => [record.date, record]));
    const week = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart);
      date.setUTCDate(weekStart.getUTCDate() + index);
      const key = date.toISOString().slice(0, 10);
      const record = byDate.get(key);
      return { day: date.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }), hours: (record?.totalWorkedSeconds || 0) / 3600 };
    });
    const attended = records.filter((record) => record.sessions?.some((session) => session.punchIn));
    const checkIns = attended.flatMap((record) => record.sessions || []).filter((session) => session.punchIn).map((session) => new Date(session.punchIn));
    const averageCheckInMinutes = checkIns.length ? checkIns.reduce((sum, date) => sum + date.getUTCHours() * 60 + date.getUTCMinutes(), 0) / checkIns.length : null;
    return res.json({ summary: { week, weekTotalHours: week.reduce((sum, item) => sum + item.hours, 0), attendanceRate: records.length ? (attended.length / records.length) * 100 : 0, averageCheckInMinutes, today: byDate.get(today) || null } });
  } catch (error) { return next(error); }
});

router.get("/today", async (req, res, next) => {
  try { return res.json({ attendance: serialized(await Attendance.findOne({ user: req.user._id, date: today() })) }); }
  catch (error) { return next(error); }
});

router.post("/punch-in", async (req, res, next) => {
  try {
    const date = today();
    const now = new Date();
    let record = await Attendance.findOne({ user: req.user._id, date });
    if (record?.status === "working") return res.status(409).json({ error: "You are already punched in" });
    if (record?.status === "completed") return res.status(409).json({ error: "Attendance is already completed" });
    if (!record) record = new Attendance({ organization: req.user.organization, user: req.user._id, date });
    record.status = "working";
    record.firstPunchIn ||= now;
    record.sessions.push({ punchIn: now });
    record.logs.push({ type: "punch_in", at: now });
    await record.save();
    return res.status(201).json({ attendance: record });
  } catch (error) { return next(error); }
});

router.post("/punch-out", async (req, res, next) => {
  try {
    const record = await Attendance.findOne({ user: req.user._id, date: today() });
    if (!record || record.status !== "working") return res.status(409).json({ error: "You are not punched in" });
    const now = new Date();
    const session = record.sessions[record.sessions.length - 1];
    session.punchOut = now;
    record.totalWorkedSeconds += Math.max(0, Math.floor((now - session.punchIn) / 1000));
    record.lastPunchOut = now;
    record.logs.push({ type: "punch_out", at: now });
    record.status = "completed";
    await record.save();
    return res.json({ attendance: record });
  } catch (error) { return next(error); }
});

router.get("/history", async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const filter = { user: req.user._id };
    if (req.query.from || req.query.to) filter.date = { ...(req.query.from ? { $gte: req.query.from } : {}), ...(req.query.to ? { $lte: req.query.to } : {}) };
    const [records, total] = await Promise.all([Attendance.find(filter).sort({ date: -1 }).skip((page - 1) * limit).limit(limit), Attendance.countDocuments(filter)]);
    return res.json({ records, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (error) { return next(error); }
});

export default router;