import Enrollment from "../models/Enrollment.js";
import Assignment from "../models/Assignment.js";
import Submission from "../models/Submission.js";
import asyncHandler from "../utils/asyncHandler.js";

// @route GET /api/dashboard/student
export const getStudentDashboard = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ student: req.user._id }).populate("course");

  const enrolledCourseIds = enrollments.map((e) => e.course._id);
  const completedCourses = enrollments.filter((e) => e.status === "completed");

  const assignments = await Assignment.find({ course: { $in: enrolledCourseIds } })
    .populate("course", "title")
    .sort({ deadline: 1 });

  const mySubmissions = await Submission.find({ student: req.user._id });
  const submittedAssignmentIds = new Set(mySubmissions.map((s) => String(s.assignment)));

  const pendingAssignments = assignments.filter(
    (a) => !submittedAssignmentIds.has(String(a._id)) && new Date(a.deadline) >= new Date()
  );
  const overdueAssignments = assignments.filter(
    (a) => !submittedAssignmentIds.has(String(a._id)) && new Date(a.deadline) < new Date()
  );

  const overallProgress =
    enrollments.length === 0
      ? 0
      : Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length);

  const recentActivity = [...mySubmissions]
    .sort((a, b) => new Date(b.submissionDate) - new Date(a.submissionDate))
    .slice(0, 5);

  res.json({
    enrolledCount: enrollments.length,
    completedCount: completedCourses.length,
    overallProgress,
    pendingAssignments: pendingAssignments.slice(0, 10),
    overdueAssignments,
    recentActivity,
    enrollments,
  });
});
