import Enrollment from "../models/Enrollment.js";
import Course from "../models/Course.js";
import asyncHandler from "../utils/asyncHandler.js";

// @route POST /api/enrollments/:courseId  (student enrolls)
export const enrollInCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) return res.status(404).json({ message: "Course not found." });

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
    .sort({ createdAt: -1 });
  res.json({ enrollments });
});

// @route GET /api/enrollments/course/:courseId  (admin: students enrolled in a course)
export const getEnrollmentsForCourse = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ course: req.params.courseId })
    .populate("student", "name email")
    .sort({ createdAt: -1 });
  res.json({ enrollments });
});

// @route GET /api/enrollments/status/:courseId (student: am I enrolled + progress)
export const getEnrollmentStatus = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findOne({ student: req.user._id, course: req.params.courseId });
  res.json({ enrolled: !!enrollment, enrollment: enrollment || null });
});
