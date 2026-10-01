import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import path from "path";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/authRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import { courseModuleRouter, moduleRouter } from "./routes/moduleRoutes.js";
import enrollmentRoutes from "./routes/enrollmentRoutes.js";
import { courseAssignmentRouter, assignmentRouter } from "./routes/assignmentRoutes.js";
import { assignmentSubmissionRouter, submissionRouter } from "./routes/submissionRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import discussionRoutes from "./routes/discussionRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import { UPLOAD_ROOT } from "./middleware/upload.js";

const app = express();
app.set("trust proxy", 1);

// CLIENT_URL may be a comma-separated list (e.g. local dev + deployed site)
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5174")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)),
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));

// Only public images are served statically. Submission files go through
// GET /api/submissions/:id/file, which checks who is asking.
app.use("/uploads/avatars", express.static(path.join(UPLOAD_ROOT, "avatars")));
app.use("/uploads/course-images", express.static(path.join(UPLOAD_ROOT, "course-images")));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Slow down password guessing and reset-email spam
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: true, legacyHeaders: false });
app.use(["/api/auth/login", "/api/auth/register", "/api/auth/forgot-password", "/api/auth/google"], authLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/courses/:courseId/modules", courseModuleRouter);
app.use("/api/courses/:courseId/assignments", courseAssignmentRouter);
app.use("/api/courses", courseRoutes);
app.use("/api/modules", moduleRouter);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/assignments/:assignmentId/submissions", assignmentSubmissionRouter);
app.use("/api/assignments", assignmentRouter);
app.use("/api/submissions", submissionRouter);
app.use("/api/admin", adminRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/discussions", discussionRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
