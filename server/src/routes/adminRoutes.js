import express from "express";
import {
  getPlatformStats,
  getEnrollmentsByCourse,
  getAvgProgressByCourse,
  getSignupsOverTime,
  getSubmissionStatusBreakdown,
  getAllStudents,
  getStudentProgress,
  adminEnrollStudent,
  adminUnenrollStudent,
  adminResetSubmission,
  adminExtendDeadline,
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  getAllSubmissions,
  sendAdminNotification,
} from "../controllers/adminController.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();
router.use(protect, requireRole("admin"));

// Dashboard & Analytics
router.get("/stats", getPlatformStats);
router.get("/analytics/enrollments-by-course", getEnrollmentsByCourse);
router.get("/analytics/avg-progress-by-course", getAvgProgressByCourse);
router.get("/analytics/signups-over-time", getSignupsOverTime);
router.get("/analytics/submission-status", getSubmissionStatusBreakdown);

// Students & Student Progress / Actions
router.get("/students", getAllStudents);
router.get("/students/:id/progress", getStudentProgress);
router.post("/students/enroll", adminEnrollStudent);
router.post("/students/unenroll", adminUnenrollStudent);

// Submissions & Deadlines
router.get("/submissions", getAllSubmissions);
router.delete("/submissions/:id/reset", adminResetSubmission);
router.post("/assignments/extend-deadline", adminExtendDeadline);

// User Management (Admin Settings)
router.get("/users", getAllUsers);
router.put("/users/:id/role", updateUserRole);
router.put("/users/:id/status", toggleUserStatus);
router.delete("/users/:id", deleteUser);

// Notifications
router.post("/notifications", sendAdminNotification);

export default router;
