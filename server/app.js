import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import connectDb from "./src/utils/db.js";
import { cookieParser } from "./middleware/cookies.js";
import authRoutes from "./routes/auth.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import { ensureDefaultAdmin } from "./src/utils/ensureDefaultAdmin.js";

const app = express();

const allowedOrigins = (
  process.env.CLIENT_ORIGIN || "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests without an Origin header
    // such as Postman or server-to-server requests
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.error("Blocked CORS origin:", origin);

    return callback(
      new Error("Blocked by CORS policy: Invalid Origin")
    );
  },

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-CSRF-Token",
  ],

  credentials: true,

  maxAge: 600,
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser);
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/admin", adminRoutes);
app.use((_req, res) => res.status(404).json({ error: "Not found" }));
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.status || 500).json({ error: "Internal server error" });
});

const port = process.env.PORT || 3000;

if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
  connectDb().then(() => ensureDefaultAdmin()).then((result) => {
    console.log(`${result.created ? "Created" : "Found existing"} default admin ${result.email}`);
    return app.listen(port, () => console.log(`Server is listening on port ${port}`));
  }).catch((error) => {
    console.error("Database startup failed", error.message);
    process.exitCode = 1;
  });
}

export default app;