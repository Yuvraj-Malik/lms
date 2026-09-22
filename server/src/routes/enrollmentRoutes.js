import express from "express";
import {
  enrollInCourse,
  getMyEnrollments,
  getEnrollmentsForCourse,
  getEnrollmentStatus,
} from "../controllers/enrollmentController.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.post("/:courseId", protect, requireRole("student"), enrollInCourse);
router.get("/my", protect, requireRole("student"), getMyEnrollments);
router.get("/status/:courseId", protect, requireRole("student"), getEnrollmentStatus);
router.get("/course/:courseId", protect, requireRole("admin"), getEnrollmentsForCourse);

export default router;
