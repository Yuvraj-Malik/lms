import fs from "fs";
import Submission from "../models/Submission.js";
import Assignment from "../models/Assignment.js";
import Enrollment from "../models/Enrollment.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ownsCourse, loadManagedCourse } from "../utils/access.js";
import { createNotification } from "./notificationController.js";
import { removeUpload, resolveUpload } from "../middleware/upload.js";
import { getSettings } from "../utils/settings.js";
import { audit } from "../utils/audit.js";

const LINK_TYPES = ["github", "drive", "url"];
const isHttpUrl = (s) => {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

// @route POST /api/assignments/:assignmentId/submissions (student)
// multipart: field "file", or body { submissionType, textContent | submissionLink }
export const submitAssignment = asyncHandler(async (req, res) => {
  const discardUpload = () => req.file && removeUpload(`/uploads/submissions/${req.file.filename}`);

  const assignment = await Assignment.findById(req.params.assignmentId).populate("course", "title createdBy");
  if (!assignment || !assignment.course) {
    discardUpload();
    return res.status(404).json({ message: "Assignment not found." });
  }

  const enrolled = await Enrollment.exists({ student: req.user._id, course: assignment.course._id });
  if (!enrolled) {
    discardUpload();
    return res.status(403).json({ message: "Enroll in this course before submitting its assignments." });
  }

  const existing = await Submission.findOne({ assignment: assignment._id, student: req.user._id });
  if (existing?.status === "graded") {
    discardUpload();
    return res.status(409).json({
      message: "This submission has already been graded. Ask your instructor to reopen it if you need to resubmit.",
    });
  }

  let submissionType = req.body.submissionType;
  const update = { textContent: "", submissionLink: "", filePath: "", fileOriginalName: "" };

  if (req.file) {
    submissionType = "file";
    update.filePath = `/uploads/submissions/${req.file.filename}`;
    update.fileOriginalName = req.file.originalname;
  } else if (submissionType === "file") {
    return res.status(400).json({ message: "Choose a file to upload." });
  } else if (submissionType === "text") {
    update.textContent = String(req.body.textContent || "").trim();
    if (!update.textContent) return res.status(400).json({ message: "Your answer can't be empty." });
  } else if (LINK_TYPES.includes(submissionType)) {
    update.submissionLink = String(req.body.submissionLink || "").trim();
    if (!isHttpUrl(update.submissionLink)) {
      return res.status(400).json({ message: "Enter a full link starting with https://" });
    }
    if (submissionType === "github" && !/github\.com/i.test(update.submissionLink)) {
      return res.status(400).json({ message: "That isn't a GitHub link." });
    }
  } else {
    return res.status(400).json({ message: "Choose how you want to submit." });
  }

  // Replacing a previous upload: remove the old file from disk
  if (existing?.filePath && existing.filePath !== update.filePath) removeUpload(existing.filePath);

  const isLate = new Date() > new Date(assignment.deadline);
  if (isLate && !(await getSettings()).allowLateSubmissions) {
    discardUpload();
    return res.status(403).json({ message: "The deadline has passed and late submissions are turned off." });
  }
  const submission = await Submission.findOneAndUpdate(
    { assignment: assignment._id, student: req.user._id },
    {
      ...update,
      submissionType,
      submissionDate: new Date(),
      status: isLate ? "late" : "submitted",
      marks: null,
      feedback: "",
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  if (assignment.course.createdBy) {
    createNotification({
      user: assignment.course.createdBy,
      sentBy: req.user._id,
      title: existing ? "Submission updated" : "New submission",
      message: `${req.user.name} ${existing ? "resubmitted" : "submitted"} "${assignment.title}"${isLate ? " (late)" : ""}.`,
      link: `/admin/courses/${assignment.course._id}?tab=submissions`,
      type: "submission_received",
    });
  }

  res.status(existing ? 200 : 201).json({ submission });
});

// @route GET /api/assignments/:assignmentId/submissions (course owner / super admin)
export const getSubmissionsForAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.assignmentId);
  if (!assignment) return res.status(404).json({ message: "Assignment not found." });
  await loadManagedCourse(req.user, assignment.course);

  const submissions = await Submission.find({ assignment: assignment._id })
    .populate("student", "name email avatar")
    .sort({ submissionDate: -1 });
  res.json({ assignment, submissions });
});

// @route GET /api/submissions/my (student)
export const getMySubmissions = asyncHandler(async (req, res) => {
  const submissions = await Submission.find({ student: req.user._id })
    .populate({ path: "assignment", populate: { path: "course", select: "title" } })
    .sort({ submissionDate: -1 });
  res.json({ submissions: submissions.filter((s) => s.assignment) });
});

// @route PUT /api/submissions/:id/grade (course owner / super admin)
export const gradeSubmission = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.id);
  if (!submission) return res.status(404).json({ message: "Submission not found." });

  const assignment = await Assignment.findById(submission.assignment);
  if (!assignment) return res.status(404).json({ message: "Assignment not found." });
  await loadManagedCourse(req.user, assignment.course);

  const marks = Number(req.body.marks);
  if (req.body.marks === "" || req.body.marks === undefined || !Number.isFinite(marks) || marks < 0 || marks > assignment.maximumMarks) {
    return res.status(400).json({ message: `Marks must be between 0 and ${assignment.maximumMarks}.` });
  }

  submission.marks = marks;
  submission.feedback = String(req.body.feedback || "").trim();
  submission.status = "graded";
  await submission.save();

  createNotification({
    user: submission.student,
    sentBy: req.user._id,
    title: `Graded: ${assignment.title}`,
    message: `You scored ${marks}/${assignment.maximumMarks}.${submission.feedback ? " Your instructor left feedback." : ""}`,
    link: `/dashboard/assignments/${assignment._id}`,
    type: "submission_graded",
  });

  await submission.populate("student", "name email avatar");
  audit(req, "submission.grade", `Graded ${submission.student?.name}'s "${assignment.title}": ${marks}/${assignment.maximumMarks}`, { targetType: "submission", targetId: submission._id, link: `/admin/submissions?open=${submission._id}` });
  res.json({ submission, message: "Submission graded." });
});

// @route GET /api/submissions/:id/file  (the student who submitted, or the course owner)
// Submission files are not served statically, so only these two people can download them.
export const downloadSubmissionFile = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.id).populate({
    path: "assignment",
    populate: { path: "course", select: "createdBy" },
  });
  if (!submission?.filePath) return res.status(404).json({ message: "File not found." });

  const isOwner = String(submission.student) === String(req.user._id);
  const isManager = submission.assignment?.course && ownsCourse(req.user, submission.assignment.course);
  if (!isOwner && !isManager) return res.status(403).json({ message: "You can't download this file." });

  const abs = resolveUpload(submission.filePath);
  if (!abs || !fs.existsSync(abs)) {
    return res.status(404).json({ message: "The uploaded file is no longer on the server." });
  }
  res.download(abs, submission.fileOriginalName || "submission");
});
