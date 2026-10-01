import express from "express";
import {
  getOverview,
  getStudents,
  getStudentDetail,
  adminEnrollStudent,
  adminUnenroll,
  adminRecalcEnrollment,
  getSubmissions,
  reopenSubmission,
  getAllUsers,
  getInstructors,
  createUser,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  sendAdminNotification,
  studentDirectory,
} from "../controllers/adminController.js";
import { protect, requireRole, requireSuperAdmin } from "../middleware/auth.js";

const router = express.Router();
router.use(protect, requireRole("admin"));

// Scoped to the admin's own courses (super admin: everything)
router.get("/overview", getOverview);
router.get("/directory", studentDirectory);
router.get("/students", getStudents);
router.get("/students/:id", getStudentDetail);
router.post("/enrollments", adminEnrollStudent);
router.delete("/enrollments/:id", adminUnenroll);
router.post("/enrollments/:id/recalculate", adminRecalcEnrollment);
router.get("/submissions", getSubmissions);
router.post("/submissions/:id/reopen", reopenSubmission);
router.post("/notifications", sendAdminNotification);

// Super admin only
router.get("/instructors", requireSuperAdmin, getInstructors);
router.get("/users", requireSuperAdmin, getAllUsers);
router.post("/users", requireSuperAdmin, createUser);
router.put("/users/:id/role", requireSuperAdmin, updateUserRole);
router.put("/users/:id/status", requireSuperAdmin, toggleUserStatus);
router.delete("/users/:id", requireSuperAdmin, deleteUser);

export default router;
