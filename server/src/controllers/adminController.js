import User from "../models/User.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Assignment from "../models/Assignment.js";
import Submission from "../models/Submission.js";
import asyncHandler from "../utils/asyncHandler.js";

// @route GET /api/admin/stats
export const getPlatformStats = asyncHandler(async (req, res) => {
  const [
    studentCount,
    courseCount,
    enrollmentCount,
    assignmentCount,
    submissionCount,
    pendingGrading,
    completedEnrollments,
  ] = await Promise.all([
    User.countDocuments({ role: "student" }),
    Course.countDocuments(),
    Enrollment.countDocuments(),
    Assignment.countDocuments(),
    Submission.countDocuments(),
    Submission.countDocuments({ status: { $ne: "graded" } }),
    Enrollment.countDocuments({ status: "completed" }),
  ]);

  const completionRate = enrollmentCount > 0 ? Math.round((completedEnrollments / enrollmentCount) * 100) : 0;

  res.json({
    studentCount,
    courseCount,
    enrollmentCount,
    assignmentCount,
    submissionCount,
    pendingGrading,
    completionRate,
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

// @route GET /api/admin/analytics/signups-over-time
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

  const [enrollments, submissions, allCourses] = await Promise.all([
    Enrollment.find({ student: student._id }).populate("course", "title category image duration difficulty"),
    Submission.find({ student: student._id })
      .populate({ path: "assignment", populate: { path: "course", select: "title" } })
      .sort({ submissionDate: -1 }),
    Course.find({ isPublished: true }).select("title category"),
  ]);

  res.json({
    student: {
      id: student._id,
      name: student.name,
      email: student.email,
      avatar: student.avatar,
      bio: student.bio,
      department: student.department || "Computer Science & Engineering",
      lastLogin: student.lastLogin || student.updatedAt,
      createdAt: student.createdAt,
      isActive: student.isActive !== false,
    },
    enrollments,
    submissions,
    allCourses,
  });
});

// @route POST /api/admin/students/enroll
export const adminEnrollStudent = asyncHandler(async (req, res) => {
  const { studentId, courseId } = req.body;
  if (!studentId || !courseId) {
    return res.status(400).json({ message: "Student ID and Course ID are required." });
  }

  const existing = await Enrollment.findOne({ student: studentId, course: courseId });
  if (existing) {
    return res.status(409).json({ message: "Student is already enrolled in this course." });
  }

  const enrollment = await Enrollment.create({ student: studentId, course: courseId });
  res.status(201).json({ enrollment });
});

// @route POST /api/admin/students/unenroll
export const adminUnenrollStudent = asyncHandler(async (req, res) => {
  const { studentId, courseId } = req.body;
  if (!studentId || !courseId) {
    return res.status(400).json({ message: "Student ID and Course ID are required." });
  }

  await Enrollment.findOneAndDelete({ student: studentId, course: courseId });
  res.json({ message: "Student unenrolled successfully." });
});

// @route DELETE /api/admin/submissions/:id/reset
export const adminResetSubmission = asyncHandler(async (req, res) => {
  const sub = await Submission.findById(req.params.id);
  if (!sub) return res.status(404).json({ message: "Submission not found." });

  await sub.deleteOne();
  res.json({ message: "Submission has been reset. The student can now resubmit." });
});

// @route POST /api/admin/assignments/extend-deadline
export const adminExtendDeadline = asyncHandler(async (req, res) => {
  const { assignmentId, newDeadline } = req.body;
  if (!assignmentId || !newDeadline || isNaN(new Date(newDeadline).getTime())) {
    return res.status(400).json({ message: "A valid Assignment ID and new deadline are required." });
  }

  const assignment = await Assignment.findByIdAndUpdate(
    assignmentId,
    { deadline: new Date(newDeadline) },
    { new: true }
  );

  if (!assignment) return res.status(404).json({ message: "Assignment not found." });

  res.json({ assignment, message: "Deadline extended successfully." });
});

// @route GET /api/admin/users
export const getAllUsers = asyncHandler(async (req, res) => {
  const { search, role, status } = req.query;
  const query = {};

  if (search?.trim()) {
    query.$or = [
      { name: { $regex: search.trim(), $options: "i" } },
      { email: { $regex: search.trim(), $options: "i" } },
    ];
  }
  if (role && ["student", "admin"].includes(role)) {
    query.role = role;
  }
  if (status === "active") {
    query.isActive = { $ne: false };
  } else if (status === "deactivated") {
    query.isActive = false;
  }

  const users = await User.find(query).sort({ createdAt: -1 });
  res.json({ users, count: users.length });
});

// @route PUT /api/admin/users/:id/role
export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!["student", "admin"].includes(role)) {
    return res.status(400).json({ message: "Role must be 'student' or 'admin'." });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found." });

  user.role = role;
  await user.save();
  res.json({ user, message: `User role updated to ${role}.` });
});

// @route PUT /api/admin/users/:id/status
export const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found." });

  user.isActive = !user.isActive;
  await user.save();
  res.json({ user, message: `User account is now ${user.isActive ? "active" : "deactivated"}.` });
});

// @route DELETE /api/admin/users/:id
export const deleteUser = asyncHandler(async (req, res) => {
  if (String(req.user._id) === String(req.params.id)) {
    return res.status(400).json({ message: "You cannot delete your own active admin account." });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found." });

  await Promise.all([
    Enrollment.deleteMany({ student: user._id }),
    Submission.deleteMany({ student: user._id }),
    user.deleteOne(),
  ]);

  res.json({ message: "User account and all related records deleted." });
});

// @route GET /api/admin/submissions (global submissions with filter)
export const getAllSubmissions = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = {};

  if (status && status !== "all") {
    if (status === "pending") query.status = { $ne: "graded" };
    else query.status = status;
  }

  const submissions = await Submission.find(query)
    .populate("student", "name email avatar")
    .populate({ path: "assignment", populate: { path: "course", select: "title" } })
    .sort({ submissionDate: -1 });

  res.json({ submissions, count: submissions.length });
});
