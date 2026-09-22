import express from "express";
import {
  getCourses,
  getCategories,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} from "../controllers/courseController.js";
import { protect, requireRole } from "../middleware/auth.js";
import { uploadCourseImage } from "../middleware/upload.js";

const router = express.Router();

router.get("/", getCourses);
router.get("/categories", getCategories);
router.get("/:id", getCourseById);

router.post("/", protect, requireRole("admin"), uploadCourseImage.single("image"), createCourse);
router.put("/:id", protect, requireRole("admin"), uploadCourseImage.single("image"), updateCourse);
router.delete("/:id", protect, requireRole("admin"), deleteCourse);

export default router;
