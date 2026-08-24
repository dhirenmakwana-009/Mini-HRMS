import bcrypt from "bcryptjs";
import { Organization } from "../../models/organization.model.js";
import { User } from "../../models/user.model.js";

const DEFAULT_ADMIN_EMAIL = "admin@gmail.com";
const DEFAULT_ADMIN_PASSWORD = "admin@123";

export async function ensureDefaultAdmin() {
  const email = String(process.env.SEED_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
  const organizationName = process.env.SEED_ORGANIZATION_NAME || "DM WebSoft";
  const organization = await Organization.findOneAndUpdate(
    { name: organizationName },
    { $setOnInsert: { name: organizationName } },
    { upsert: true, new: true },
  );
  const existing = await User.exists({ email });
  if (existing) return { created: false, email };

  const password = process.env.SEED_ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({
    email,
    password: passwordHash,
    name: process.env.SEED_ADMIN_NAME || "System Administrator",
    role: "admin",
    organization: organization._id,
    isActive: true,
  });
  return { created: true, email };
}