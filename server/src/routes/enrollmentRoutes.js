import express from "express";
import {
  enrollInCourse,
  getMyEnrollments,
  getEnrollmentsForCourse,
  getEnrollmentStatus,
  verifyCertificate,
} from "../controllers/enrollmentController.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/verify/:credentialId", verifyCertificate);
router.get("/my", protect, requireRole("student"), getMyEnrollments);
router.get("/status/:courseId", protect, requireRole("student"), getEnrollmentStatus);
router.get("/course/:courseId", protect, requireRole("admin"), getEnrollmentsForCourse);
router.post("/:courseId", protect, requireRole("student"), enrollInCourse);

export default router;
