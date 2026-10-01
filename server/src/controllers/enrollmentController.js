import mongoose from "mongoose";
import Enrollment from "../models/Enrollment.js";
import Course from "../models/Course.js";
import Module from "../models/Module.js";
import asyncHandler from "../utils/asyncHandler.js";
import { loadManagedCourse } from "../utils/access.js";

// @route POST /api/enrollments/:courseId  (student enrolls)
export const enrollInCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course || !course.isPublished) return res.status(404).json({ message: "Course not found." });

  const existing = await Enrollment.findOne({ student: req.user._id, course: course._id });
  if (existing) {
    return res.status(409).json({ message: "You are already enrolled in this course." });
  }

  const enrollment = await Enrollment.create({ student: req.user._id, course: course._id });
  res.status(201).json({ enrollment });
});

// @route GET /api/enrollments/my  (student's enrolled courses)
export const getMyEnrollments = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ student: req.user._id })
    .populate("course")
    .sort({ updatedAt: -1 });
  // A course may have been deleted by its owner; hide orphaned rows
  const live = enrollments.filter((e) => e.course);
  const counts = await Module.aggregate([
    { $match: { course: { $in: live.map((e) => e.course._id) } } },
    { $group: { _id: "$course", n: { $sum: 1 } } },
  ]);
  const map = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
  res.json({ enrollments: live.map((e) => ({ ...e.toObject(), moduleCount: map[String(e.course._id)] || 0 })) });
});

// @route GET /api/enrollments/course/:courseId  (course owner / super admin)
export const getEnrollmentsForCourse = asyncHandler(async (req, res) => {
  await loadManagedCourse(req.user, req.params.courseId);
  const enrollments = await Enrollment.find({ course: req.params.courseId })
    .populate("student", "name email avatar isActive")
    .sort({ createdAt: -1 });
  res.json({ enrollments: enrollments.filter((e) => e.student) });
});

// @route GET /api/enrollments/status/:courseId (student: am I enrolled + progress)
export const getEnrollmentStatus = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findOne({ student: req.user._id, course: req.params.courseId });
  res.json({ enrolled: !!enrollment, enrollment: enrollment || null });
});

export const certificateId = (enrollmentId) => `RDG-${String(enrollmentId).toUpperCase()}`;

// @route GET /api/enrollments/verify/:credentialId  (public certificate check)
// Credential IDs are "RDG-" + the enrollment's id, so lookups are a single indexed query.
export const verifyCertificate = asyncHandler(async (req, res) => {
  const raw = String(req.params.credentialId || "").trim();
  const id = raw.replace(/^RDG-/i, "").toLowerCase();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.json({ valid: false, message: "That doesn't look like a Ridgeline certificate ID." });
  }

  const enrollment = await Enrollment.findById(id)
    .populate("student", "name")
    .populate("course", "title category instructor duration");

  if (!enrollment || enrollment.status !== "completed" || !enrollment.course || !enrollment.student) {
    return res.json({ valid: false, message: "No completed course matches this certificate ID." });
  }

  res.json({
    valid: true,
    cert: {
      id: certificateId(enrollment._id),
      studentName: enrollment.student.name,
      courseTitle: enrollment.course.title,
      courseCategory: enrollment.course.category,
      instructor: enrollment.course.instructor,
      duration: enrollment.course.duration,
      issueDate: enrollment.completedAt || enrollment.updatedAt,
      completedModules: enrollment.completedModules.length,
    },
  });
});
