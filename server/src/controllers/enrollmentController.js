import mongoose from "mongoose";
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

// @route GET /api/enrollments/verify/:credentialId (public: verify certificate authenticity)
export const verifyCertificate = asyncHandler(async (req, res) => {
  const { credentialId } = req.params;

  let query = null;
  const cleanId = credentialId.replace(/^RIDG-2026-/, "").trim();

  if (mongoose.Types.ObjectId.isValid(cleanId)) {
    query = { _id: cleanId };
  } else if (cleanId.length >= 6) {
    // Try matching the last chars of ObjectId
    const allCompleted = await Enrollment.find({
      $or: [{ progress: 100 }, { status: "completed" }],
    })
      .populate("student", "name email")
      .populate("course", "title category instructor duration");

    const matched = allCompleted.find((e) =>
      e._id.toString().toUpperCase().endsWith(cleanId.toUpperCase())
    );

    if (matched) {
      const cert = {
        id: `RIDG-2026-${matched._id.toString().toUpperCase().slice(-8)}`,
        enrollmentId: matched._id,
        studentName: matched.student?.name || "Student",
        studentEmail: matched.student?.email || "",
        courseTitle: matched.course?.title || "Curriculum",
        courseCategory: matched.course?.category || "Professional Development",
        instructor: matched.course?.instructor || "Ridgeline Faculty",
        duration: matched.course?.duration || "10 Weeks",
        issueDate: matched.updatedAt || matched.createdAt,
        completedModules: matched.completedModules?.length || 0,
        progress: matched.progress,
        status: "Verified",
        institution: "Ridgeline Institute of Technology & Advanced Learning",
      };
      return res.json({ valid: true, cert });
    }
  }

  if (!query) {
    return res.status(404).json({
      valid: false,
      message: "Certificate credential format is unrecognized.",
    });
  }

  const enrollment = await Enrollment.findOne(query)
    .populate("student", "name email")
    .populate("course", "title category instructor duration");

  if (!enrollment || (enrollment.progress < 100 && enrollment.status !== "completed")) {
    return res.status(404).json({
      valid: false,
      message: "Certificate credential not found or course requirements not yet satisfied.",
    });
  }

  const cert = {
    id: `RIDG-2026-${enrollment._id.toString().toUpperCase().slice(-8)}`,
    enrollmentId: enrollment._id,
    studentName: enrollment.student?.name || "Student",
    studentEmail: enrollment.student?.email || "",
    courseTitle: enrollment.course?.title || "Curriculum",
    courseCategory: enrollment.course?.category || "Professional Development",
    instructor: enrollment.course?.instructor || "Ridgeline Faculty",
    duration: enrollment.course?.duration || "10 Weeks",
    issueDate: enrollment.updatedAt || enrollment.createdAt,
    completedModules: enrollment.completedModules?.length || 0,
    progress: enrollment.progress,
    status: "Verified",
    institution: "Ridgeline Institute of Technology & Advanced Learning",
  };

  res.json({ valid: true, cert });
});
