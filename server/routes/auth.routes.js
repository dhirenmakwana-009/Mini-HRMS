import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { auth, accessCookie, cookieOptions, signAccessToken } from "../middleware/auth.js";

const router = Router();
const refreshCookie = "hrms_refresh";
const refreshDays = 7;
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");

router.post("/login", async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    const user = await User.findOne({ email }).select("+password +refreshTokenHash");
    if (!user || !user.isActive || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const refreshToken = crypto.randomBytes(48).toString("hex");
    user.refreshTokenHash = hash(refreshToken);
    await user.save({ validateBeforeSave: false });
    res.cookie(accessCookie, signAccessToken(user), cookieOptions(15 * 60 * 1000));
    res.cookie(refreshCookie, refreshToken, cookieOptions(refreshDays * 24 * 60 * 60 * 1000));
    return res.json({ user: publicUser(user) });
  } catch (error) { return next(error); }
});

router.post("/refresh", async (req, res, next) => {
  try {
    const token = req.cookies?.[refreshCookie];
    if (!token) return res.status(401).json({ error: "Authentication required" });
    const user = await User.findOne({ refreshTokenHash: hash(token) }).select("+refreshTokenHash");
    if (!user || !user.isActive) return res.status(401).json({ error: "Authentication required" });
    const nextToken = crypto.randomBytes(48).toString("hex");
    user.refreshTokenHash = hash(nextToken);
    await user.save({ validateBeforeSave: false });
    res.cookie(accessCookie, signAccessToken(user), cookieOptions(15 * 60 * 1000));
    res.cookie(refreshCookie, nextToken, cookieOptions(refreshDays * 24 * 60 * 60 * 1000));
    return res.json({ user: publicUser(user) });
  } catch (error) { return next(error); }
});

router.get("/me", auth, (req, res) => res.json({ user: publicUser(req.user) }));

router.post("/logout", async (req, res, next) => {
  try {
    const token = req.cookies?.[refreshCookie];
    if (token) await User.updateOne({ refreshTokenHash: hash(token) }, { $unset: { refreshTokenHash: 1 } });
    res.clearCookie(accessCookie, cookieOptions());
    res.clearCookie(refreshCookie, cookieOptions());
    return res.json({ message: "Logged out" });
  } catch (error) { return next(error); }
});

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role, initials: user.initials || user.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(), department: user.department, designation: user.designation, shiftStart: user.shiftStart, shiftEnd: user.shiftEnd };
}

export default router;