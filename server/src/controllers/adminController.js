import User from "../models/User.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Assignment from "../models/Assignment.js";
import Submission from "../models/Submission.js";
import asyncHandler from "../utils/asyncHandler.js";

// @route GET /api/admin/stats
export const getPlatformStats = asyncHandler(async (req, res) => {
  const [studentCount, courseCount, enrollmentCount, assignmentCount, submissionCount, pendingGrading] =
    await Promise.all([
      User.countDocuments({ role: "student" }),
      Course.countDocuments(),
      Enrollment.countDocuments(),
      Assignment.countDocuments(),
      Submission.countDocuments(),
      Submission.countDocuments({ status: { $ne: "graded" } }),
    ]);

  res.json({
    studentCount,
    courseCount,
    enrollmentCount,
    assignmentCount,
    submissionCount,
    pendingGrading,
  });
});

// @route GET /api/admin/analytics/enrollments-by-course
export const getEnrollmentsByCourse = asyncHandler(async (req, res) => {
  const data = await Enrollment.aggregate([
    { $group: { _id: "$course", count: { $sum: 1 } } },
    { $lookup: { from: "courses", localField: "_id", foreignField: "_id", as: "course" } },
    { $unwind: "$course" },
    { $project: { _id: 0, courseTitle: "$course.title", count: 1 } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);
  res.json({ data });
});

// @route GET /api/admin/analytics/avg-progress-by-course
export const getAvgProgressByCourse = asyncHandler(async (req, res) => {
  const data = await Enrollment.aggregate([
    { $group: { _id: "$course", avgProgress: { $avg: "$progress" } } },
    { $lookup: { from: "courses", localField: "_id", foreignField: "_id", as: "course" } },
    { $unwind: "$course" },
    { $project: { _id: 0, courseTitle: "$course.title", avgProgress: { $round: ["$avgProgress", 1] } } },
    { $sort: { avgProgress: -1 } },
  ]);
  res.json({ data });
});

// @route GET /api/admin/analytics/signups-over-time  (students registered per day, last 30 days)
export const getSignupsOverTime = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const data = await User.aggregate([
    { $match: { role: "student", createdAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: "$_id", count: 1 } },
  ]);
  res.json({ data });
});

// @route GET /api/admin/analytics/submission-status
export const getSubmissionStatusBreakdown = asyncHandler(async (req, res) => {
  const data = await Submission.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
    { $project: { _id: 0, status: "$_id", count: 1 } },
  ]);
  res.json({ data });
});

// @route GET /api/admin/students
export const getAllStudents = asyncHandler(async (req, res) => {
  const students = await User.find({ role: "student" }).sort({ createdAt: -1 });
  const withCounts = await Promise.all(
    students.map(async (s) => {
      const enrollmentCount = await Enrollment.countDocuments({ student: s._id });
      return { ...s.toObject(), enrollmentCount };
    })
  );
  res.json({ students: withCounts });
});

// @route GET /api/admin/students/:id/progress
export const getStudentProgress = asyncHandler(async (req, res) => {
  const student = await User.findById(req.params.id);
  if (!student || student.role !== "student") {
    return res.status(404).json({ message: "Student not found." });
  }
  const enrollments = await Enrollment.find({ student: student._id }).populate("course", "title category");
  res.json({ student: { id: student._id, name: student.name, email: student.email }, enrollments });
});
