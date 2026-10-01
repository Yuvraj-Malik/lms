import Enrollment from "../models/Enrollment.js";
import Assignment from "../models/Assignment.js";
import Submission from "../models/Submission.js";
import Module from "../models/Module.js";
import asyncHandler from "../utils/asyncHandler.js";

// @route GET /api/dashboard/student — everything on the student home screen, for the logged-in student only
export const getStudentDashboard = asyncHandler(async (req, res) => {
  const enrollments = (await Enrollment.find({ student: req.user._id }).populate("course").sort({ updatedAt: -1 })).filter(
    (e) => e.course
  );
  const courseIds = enrollments.map((e) => e.course._id);

  const [assignments, mySubmissions, modules] = await Promise.all([
    Assignment.find({ course: { $in: courseIds } }).populate("course", "title").sort({ deadline: 1 }),
    Submission.find({ student: req.user._id })
      .populate({ path: "assignment", select: "title maximumMarks course", populate: { path: "course", select: "title" } })
      .sort({ updatedAt: -1 }),
    Module.find({ course: { $in: courseIds } }).select("title course moduleOrder").sort({ moduleOrder: 1 }),
  ]);

  const submitted = new Set(mySubmissions.map((s) => String(s.assignment?._id)));
  const now = new Date();
  const pendingAssignments = assignments.filter((a) => !submitted.has(String(a._id)) && a.deadline >= now);
  const overdueAssignments = assignments.filter((a) => !submitted.has(String(a._id)) && a.deadline < now);

  // The next unfinished module in each active course ("continue where you left off")
  const nextModules = enrollments
    .filter((e) => e.status !== "completed")
    .map((e) => {
      const done = new Set(e.completedModules.map(String));
      const next = modules.find((m) => String(m.course) === String(e.course._id) && !done.has(String(m._id)));
      return next ? { courseId: e.course._id, courseTitle: e.course.title, moduleTitle: next.title, moduleOrder: next.moduleOrder, progress: e.progress } : null;
    })
    .filter(Boolean);

  const graded = mySubmissions.filter((s) => s.status === "graded" && s.assignment);
  const averageScore = graded.length
    ? Math.round((graded.reduce((sum, s) => sum + s.marks / (s.assignment.maximumMarks || 100), 0) / graded.length) * 100)
    : null;

  res.json({
    enrolledCount: enrollments.length,
    completedCount: enrollments.filter((e) => e.status === "completed").length,
    overallProgress: enrollments.length ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length) : 0,
    averageScore,
    pendingAssignments,
    overdueAssignments,
    recentActivity: mySubmissions.filter((s) => s.assignment).slice(0, 6),
    nextModules,
    enrollments,
  });
});
