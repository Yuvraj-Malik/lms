import User from "../models/User.js";
import Enrollment from "../models/Enrollment.js";
import asyncHandler from "../utils/asyncHandler.js";

// @route GET /api/users/student-profile
export const getStudentFullProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const enrollments = await Enrollment.find({ student: user._id })
    .populate("course", "title category duration difficulty image")
    .sort({ createdAt: -1 });

  let completedCourses = 0;
  let inProgressCourses = 0;
  let notStartedCourses = 0;
  let totalModulesCompleted = 0;

  const certificates = [];

  enrollments.forEach((e) => {
    const modulesDone = e.completedModules?.length || 0;
    totalModulesCompleted += modulesDone;

    if (e.status === "completed" || e.progress >= 100) {
      completedCourses += 1;
      certificates.push({
        id: `CERT-${e._id.toString().slice(-8).toUpperCase()}`,
        courseTitle: e.course?.title || "Course",
        category: e.course?.category || "General",
        studentName: user.name,
        issueDate: e.updatedAt || e.createdAt,
        enrollmentId: e._id,
      });
    } else if (e.progress > 0) {
      inProgressCourses += 1;
    } else {
      notStartedCourses += 1;
    }
  });

  // Estimate 3 hours per completed module
  const totalLearningHours = totalModulesCompleted * 3;

  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      department: user.department || "Computer Science & Engineering",
      createdAt: user.createdAt,
      lastLogin: user.lastLogin || user.updatedAt,
      notificationPreferences: user.notificationPreferences,
    },
    learningSummary: {
      completedCourses,
      inProgressCourses,
      notStartedCourses,
      totalModulesCompleted,
      totalLearningHours,
    },
    certificates,
    learningHistory: enrollments,
  });
});

// @route PUT /api/users/profile
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { name, bio, department, notificationPreferences } = req.body;

  if (name?.trim()) user.name = name.trim();
  if (bio !== undefined) user.bio = bio;
  if (department?.trim()) user.department = department.trim();

  if (notificationPreferences) {
    try {
      const prefs = typeof notificationPreferences === "string"
        ? JSON.parse(notificationPreferences)
        : notificationPreferences;
      user.notificationPreferences = { ...user.notificationPreferences, ...prefs };
    } catch (e) {}
  }

  if (req.file) user.avatar = `/uploads/avatars/${req.file.filename}`;

  await user.save();
  res.json({ user, message: "Profile updated successfully." });
});

// @route PUT /api/users/change-password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: "A new password (6+ characters) is required." });
  }

  const user = await User.findById(req.user._id).select("+password");

  if (user.password) {
    // Existing password: verify it before allowing an update
    if (!currentPassword) {
      return res.status(400).json({ message: "Current password is required to update your password." });
    }
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(401).json({ message: "Current password is incorrect." });
  }

  const isFirstPassword = !user.password;
  user.password = newPassword;
  await user.save();

  res.json({
    message: isFirstPassword ? "Password created successfully." : "Password changed successfully.",
    hasPassword: true,
  });
});
