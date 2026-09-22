import express from "express";
import {
  submitAssignment,
  getSubmissionsForAssignment,
  getMySubmissions,
  gradeSubmission,
} from "../controllers/submissionController.js";
import { protect, requireRole } from "../middleware/auth.js";
import { uploadSubmission } from "../middleware/upload.js";

// nested under /api/assignments/:assignmentId/submissions
export const assignmentSubmissionRouter = express.Router({ mergeParams: true });
assignmentSubmissionRouter.post(
  "/",
  protect,
  requireRole("student"),
  uploadSubmission.single("file"),
  submitAssignment
);
assignmentSubmissionRouter.get("/", protect, requireRole("admin"), getSubmissionsForAssignment);

// top-level /api/submissions
export const submissionRouter = express.Router();
submissionRouter.get("/my", protect, requireRole("student"), getMySubmissions);
submissionRouter.put("/:id/grade", protect, requireRole("admin"), gradeSubmission);
