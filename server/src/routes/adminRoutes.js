import express from "express";
import {
  getPlatformStats,
  getEnrollmentsByCourse,
  getAvgProgressByCourse,
  getSignupsOverTime,
  getSubmissionStatusBreakdown,
  getAllStudents,
  getStudentProgress,
} from "../controllers/adminController.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();
router.use(protect, requireRole("admin"));

router.get("/stats", getPlatformStats);
router.get("/analytics/enrollments-by-course", getEnrollmentsByCourse);
router.get("/analytics/avg-progress-by-course", getAvgProgressByCourse);
router.get("/analytics/signups-over-time", getSignupsOverTime);
router.get("/analytics/submission-status", getSubmissionStatusBreakdown);
router.get("/students", getAllStudents);
router.get("/students/:id/progress", getStudentProgress);

export default router;
