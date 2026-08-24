import app from "../app.js";
import connectDb from "../src/utils/db.js";
import { ensureDefaultAdmin } from "../src/utils/ensureDefaultAdmin.js";

let databasePromise;

export default async function handler(req, res) {
  databasePromise ||= connectDb().then(ensureDefaultAdmin);
  try {
    await databasePromise;
  } catch (error) {
    databasePromise = undefined;
    console.error("Database initialization failed", error.message);
    return res.status(503).json({ error: "Service temporarily unavailable" });
  }
  return app(req, res);
}