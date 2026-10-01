import express from "express";
import {
  submitAssignment,
  getSubmissionsForAssignment,
  getMySubmissions,
  gradeSubmission,
  downloadSubmissionFile,
} from "../controllers/submissionController.js";
import { protect, requireRole } from "../middleware/auth.js";
import { uploadSubmission } from "../middleware/upload.js";

// /api/assignments/:assignmentId/submissions
export const assignmentSubmissionRouter = express.Router({ mergeParams: true });
assignmentSubmissionRouter.post("/", protect, requireRole("student"), uploadSubmission.single("file"), submitAssignment);
assignmentSubmissionRouter.get("/", protect, requireRole("admin"), getSubmissionsForAssignment);

// /api/submissions
export const submissionRouter = express.Router();
submissionRouter.get("/my", protect, requireRole("student"), getMySubmissions);
submissionRouter.get("/:id/file", protect, downloadSubmissionFile);
submissionRouter.put("/:id/grade", protect, requireRole("admin"), gradeSubmission);
