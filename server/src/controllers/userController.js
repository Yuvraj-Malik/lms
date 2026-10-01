import User from "../models/User.js";
import Enrollment from "../models/Enrollment.js";
import Submission from "../models/Submission.js";
import QuizAttempt from "../models/QuizAttempt.js";
import asyncHandler from "../utils/asyncHandler.js";
import { publicUser } from "./authController.js";
import { certificateId } from "./enrollmentController.js";
import { removeUpload } from "../middleware/upload.js";

// @route GET /api/users/student-profile — the logged-in student's record, certificates and stats
export const getStudentFullProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("+password");
  const [enrollments, submissions, quizAttempts] = await Promise.all([
    Enrollment.find({ student: user._id }).populate("course", "title category duration difficulty instructor").sort({ createdAt: -1 }),
    Submission.find({ student: user._id }).populate("assignment", "maximumMarks"),
    QuizAttempt.find({ student: user._id }).select("module passed"),
  ]);

  const live = enrollments.filter((e) => e.course);
  const completed = live.filter((e) => e.status === "completed");
  const graded = submissions.filter((s) => s.status === "graded" && s.assignment);

  res.json({
    user: publicUser(user, !!user.password),
    summary: {
      enrolled: live.length,
      completed: completed.length,
      inProgress: live.filter((e) => e.status !== "completed" && e.progress > 0).length,
      notStarted: live.filter((e) => e.progress === 0).length,
      modulesCompleted: live.reduce((n, e) => n + e.completedModules.length, 0),
      submissions: submissions.length,
      averageScore: graded.length
        ? Math.round((graded.reduce((sum, s) => sum + s.marks / s.assignment.maximumMarks, 0) / graded.length) * 100)
        : null,
      quizzesPassed: new Set(quizAttempts.filter((q) => q.passed).map((q) => String(q.module))).size,
    },
    certificates: completed.map((e) => ({
      id: certificateId(e._id),
      enrollmentId: e._id,
      courseTitle: e.course.title,
      category: e.course.category,
      instructor: e.course.instructor,
      duration: e.course.duration,
      studentName: user.name,
      issueDate: e.completedAt || e.updatedAt,
    })),
    enrollments: live,
  });
});

// @route PUT /api/users/profile  (multipart: name, bio, department, notificationPreferences, avatar)
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("+password");
  const { name, bio, department, notificationPreferences, removeAvatar } = req.body;

  if (name !== undefined) {
    if (!String(name).trim()) return res.status(400).json({ message: "Name can't be empty." });
    user.name = String(name).trim().slice(0, 80);
  }
  if (bio !== undefined) user.bio = String(bio).slice(0, 500);
  if (department !== undefined) user.department = String(department).trim().slice(0, 120);

  if (notificationPreferences) {
    let prefs = notificationPreferences;
    if (typeof prefs === "string") {
      try {
        prefs = JSON.parse(prefs);
      } catch {
        return res.status(400).json({ message: "Invalid notification preferences." });
      }
    }
    const current = user.notificationPreferences?.toObject?.() || user.notificationPreferences || {};
    ["emailNotifications", "assignmentAlerts", "gradeAlerts"].forEach((k) => {
      if (typeof prefs[k] === "boolean") current[k] = prefs[k];
    });
    user.notificationPreferences = current;
  }

  if (req.file) {
    removeUpload(user.avatar);
    user.avatar = `/uploads/avatars/${req.file.filename}`;
  } else if (removeAvatar === "true" || removeAvatar === true) {
    removeUpload(user.avatar);
    user.avatar = "";
  }

  await user.save();
  res.json({ user: publicUser(user, !!user.password), message: "Profile saved." });
});

// @route PUT /api/users/change-password  { currentPassword?, newPassword }
// Google-only accounts have no password yet, so they can create one without a current password.
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: "New password must be at least 6 characters." });
  }

  const user = await User.findById(req.user._id).select("+password");
  const isFirstPassword = !user.password;

  if (!isFirstPassword) {
    if (!currentPassword) return res.status(400).json({ message: "Enter your current password." });
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }
  }

  user.password = newPassword;
  await user.save();
  res.json({ message: isFirstPassword ? "Password created." : "Password changed.", hasPassword: true });
});
