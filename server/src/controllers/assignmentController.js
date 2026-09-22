import Assignment from "../models/Assignment.js";
import Submission from "../models/Submission.js";
import asyncHandler from "../utils/asyncHandler.js";

// @route GET /api/courses/:courseId/assignments
export const getAssignmentsForCourse = asyncHandler(async (req, res) => {
  const assignments = await Assignment.find({ course: req.params.courseId }).sort({ deadline: 1 });

  // If a student is asking, attach their submission status per assignment
  if (req.user?.role === "student") {
    const subs = await Submission.find({
      assignment: { $in: assignments.map((a) => a._id) },
      student: req.user._id,
    });
    const subMap = Object.fromEntries(subs.map((s) => [String(s.assignment), s]));
    const enriched = assignments.map((a) => ({
      ...a.toObject(),
      mySubmission: subMap[String(a._id)] || null,
    }));
    return res.json({ assignments: enriched });
  }

  res.json({ assignments });
});

import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import { createNotification } from "./notificationController.js";

// @route POST /api/courses/:courseId/assignments (admin)
export const createAssignment = asyncHandler(async (req, res) => {
  const { title, description, instructions, deadline, maximumMarks } = req.body;
  if (!title?.trim() || !deadline) {
    return res.status(400).json({ message: "Title and deadline are required." });
  }

  const deadlineDate = new Date(deadline);
  if (isNaN(deadlineDate.getTime())) {
    return res.status(400).json({ message: "Invalid deadline date format." });
  }

  const marks = maximumMarks ? Number(maximumMarks) : 100;
  if (isNaN(marks) || marks <= 0) {
    return res.status(400).json({ message: "Maximum marks must be a positive number." });
  }

  const course = await Course.findById(req.params.courseId);
  if (!course) return res.status(404).json({ message: "Course not found." });

  const assignment = await Assignment.create({
    course: course._id,
    title: title.trim(),
    description: description || "",
    instructions: instructions || "",
    deadline: deadlineDate,
    maximumMarks: marks,
  });

  // Notify all students currently enrolled in this course
  const enrollments = await Enrollment.find({ course: course._id });
  for (const enr of enrollments) {
    createNotification({
      user: enr.student,
      title: `New Assignment in ${course.title}`,
      message: `${assignment.title} has been posted. Due: ${deadlineDate.toLocaleDateString()}.`,
      link: `/dashboard/assignments/${assignment._id}`,
      type: "assignment_new",
    });
  }

  res.status(201).json({ assignment });
});

// @route GET /api/assignments/:id
export const getAssignmentById = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id).populate("course", "title");
  if (!assignment) return res.status(404).json({ message: "Assignment not found." });

  let mySubmission = null;
  if (req.user?.role === "student") {
    mySubmission = await Submission.findOne({ assignment: assignment._id, student: req.user._id });
  }

  res.json({ assignment, mySubmission });
});

// @route PUT /api/assignments/:id (admin)
export const updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) return res.status(404).json({ message: "Assignment not found." });

  const fields = ["title", "description", "instructions", "deadline", "maximumMarks"];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) assignment[f] = req.body[f];
  });

  await assignment.save();
  res.json({ assignment });
});

// @route DELETE /api/assignments/:id (admin)
export const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) return res.status(404).json({ message: "Assignment not found." });

  await Submission.deleteMany({ assignment: assignment._id });
  await assignment.deleteOne();

  res.json({ message: "Assignment and its submissions deleted." });
});
