import express from "express";
import {
  getAssignmentsForCourse,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from "../controllers/assignmentController.js";
import { protect, requireRole } from "../middleware/auth.js";

export const courseAssignmentRouter = express.Router({ mergeParams: true });
courseAssignmentRouter.get("/", protect, getAssignmentsForCourse);
courseAssignmentRouter.post("/", protect, requireRole("admin"), createAssignment);

export const assignmentRouter = express.Router();
assignmentRouter.get("/:id", protect, getAssignmentById);
assignmentRouter.put("/:id", protect, requireRole("admin"), updateAssignment);
assignmentRouter.delete("/:id", protect, requireRole("admin"), deleteAssignment);
