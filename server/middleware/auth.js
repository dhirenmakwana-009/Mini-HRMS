import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

const accessCookie = "hrms_access";

export const signAccessToken = (user) => jwt.sign(
  { sub: user._id.toString(), role: user.role, organization: user.organization.toString() },
  process.env.JWT_SECRET,
  { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m" },
);

export const auth = async (req, res, next) => {
  try {
    const token = req.cookies?.[accessCookie];
    if (!token) return res.status(401).json({ error: "Authentication required" });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select("-password -refreshTokenHash");
    if (!user || !user.isActive) return res.status(401).json({ error: "Authentication required" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Authentication required" });
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) return res.status(403).json({ error: "Access denied" });
  next();
};

export const cookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === "true" || process.env.NODE_ENV === "production",
  sameSite: process.env.COOKIE_SAME_SITE || (process.env.NODE_ENV === "production" ? "none" : "lax"),
  ...(maxAge ? { maxAge } : {}),
});

export { accessCookie };