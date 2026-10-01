import express from "express";
import {
  getAssignmentsForCourse,
  getMyAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from "../controllers/assignmentController.js";
import { protect, requireRole } from "../middleware/auth.js";

// /api/courses/:courseId/assignments
export const courseAssignmentRouter = express.Router({ mergeParams: true });
courseAssignmentRouter.get("/", protect, getAssignmentsForCourse);
courseAssignmentRouter.post("/", protect, requireRole("admin"), createAssignment);

// /api/assignments
export const assignmentRouter = express.Router();
assignmentRouter.get("/my", protect, requireRole("student"), getMyAssignments);
assignmentRouter.get("/:id", protect, getAssignmentById);
assignmentRouter.put("/:id", protect, requireRole("admin"), updateAssignment);
assignmentRouter.delete("/:id", protect, requireRole("admin"), deleteAssignment);
