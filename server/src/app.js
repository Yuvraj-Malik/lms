import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import path from "path";

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
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));

// Static file serving for uploaded course images, avatars, submissions
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/courses/:courseId/modules", courseModuleRouter);
app.use("/api/modules", moduleRouter);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/courses/:courseId/assignments", courseAssignmentRouter);
app.use("/api/assignments", assignmentRouter);
app.use("/api/assignments/:assignmentId/submissions", assignmentSubmissionRouter);
app.use("/api/submissions", submissionRouter);
app.use("/api/admin", adminRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
