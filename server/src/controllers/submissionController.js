import fs from "fs";
import Submission from "../models/Submission.js";
import Assignment from "../models/Assignment.js";
import asyncHandler from "../utils/asyncHandler.js";

import User from "../models/User.js";
import { createNotification } from "./notificationController.js";

// @route POST /api/assignments/:assignmentId/submissions (student)
// Accepts either a file upload (field "file") or JSON body { submissionType, textContent/submissionLink }
export const submitAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.assignmentId).populate("course", "title");
  if (!assignment) return res.status(404).json({ message: "Assignment not found." });

  let submissionType = req.body.submissionType;
  let textContent = "";
  let submissionLink = "";
  let filePath = "";
  let fileOriginalName = "";

  if (req.file) {
    submissionType = "file";
    filePath = `/uploads/submissions/${req.file.filename}`;
    fileOriginalName = req.file.originalname;
  } else if (submissionType === "text") {
    textContent = req.body.textContent || "";
    if (!textContent.trim()) return res.status(400).json({ message: "Text submission cannot be empty." });
  } else if (["github", "drive", "url"].includes(submissionType)) {
    submissionLink = req.body.submissionLink || "";
    if (!submissionLink.trim()) return res.status(400).json({ message: "A link is required for this submission type." });
  } else {
    return res.status(400).json({ message: "Invalid or missing submission type." });
  }

  const isLate = new Date() > new Date(assignment.deadline);

  const update = {
    student: req.user._id,
    assignment: assignment._id,
    submissionType,
    textContent,
    submissionLink,
    filePath,
    fileOriginalName,
    submissionDate: new Date(),
    status: isLate ? "late" : "submitted",
  };

  // Upsert: resubmitting replaces the previous submission (and its old file, if any)
  const existing = await Submission.findOne({ assignment: assignment._id, student: req.user._id });
  if (existing?.filePath && req.file) {
    const oldPath = `${process.cwd()}${existing.filePath}`;
    fs.existsSync(oldPath) && fs.unlink(oldPath, () => {});
  }

  const submission = await Submission.findOneAndUpdate(
    { assignment: assignment._id, student: req.user._id },
    update,
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  // Notify all admins of the submission
  const admins = await User.find({ role: "admin" });
  for (const admin of admins) {
    createNotification({
      user: admin._id,
      title: "New Assignment Submission",
      message: `${req.user.name} submitted work for "${assignment.title}".`,
      link: "/admin/submissions",
      type: "submission_received",
    });
  }

  res.status(201).json({ submission });
});

// @route GET /api/assignments/:assignmentId/submissions (admin - view all for an assignment)
export const getSubmissionsForAssignment = asyncHandler(async (req, res) => {
  const submissions = await Submission.find({ assignment: req.params.assignmentId })
    .populate("student", "name email avatar")
    .sort({ submissionDate: -1 });
  res.json({ submissions });
});

// @route GET /api/submissions/my (student - all their submissions)
export const getMySubmissions = asyncHandler(async (req, res) => {
  const submissions = await Submission.find({ student: req.user._id })
    .populate({ path: "assignment", populate: { path: "course", select: "title" } })
    .sort({ submissionDate: -1 });
  res.json({ submissions });
});

// @route PUT /api/submissions/:id/grade (admin - marks + feedback)
export const gradeSubmission = asyncHandler(async (req, res) => {
  const { marks, feedback } = req.body;
  const submission = await Submission.findById(req.params.id);
  if (!submission) return res.status(404).json({ message: "Submission not found." });

  const assignment = await Assignment.findById(submission.assignment);
  if (marks !== undefined) {
    if (isNaN(marks) || marks < 0 || marks > assignment.maximumMarks) {
      return res.status(400).json({ message: `Marks must be between 0 and ${assignment.maximumMarks}.` });
    }
    submission.marks = marks;
    submission.status = "graded";
  }
  if (feedback !== undefined) submission.feedback = feedback;

  await submission.save();

  // Notify student of grading and feedback
  createNotification({
    user: submission.student,
    title: `Assignment Graded: ${assignment.title}`,
    message: `Your score: ${marks}/${assignment.maximumMarks}.${feedback ? ' Feedback: "' + feedback + '"' : ""}`,
    link: `/dashboard/assignments/${assignment._id}`,
    type: "submission_graded",
  });

  res.json({ submission, message: "Submission graded successfully." });
});
