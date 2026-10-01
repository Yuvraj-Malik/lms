import User from "../models/User.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Assignment from "../models/Assignment.js";
import Submission from "../models/Submission.js";
import QuizAttempt from "../models/QuizAttempt.js";
import Discussion from "../models/Discussion.js";
import Notification from "../models/Notification.js";
import asyncHandler from "../utils/asyncHandler.js";
import { isSuper, managedCourseIds, loadManagedCourse, HttpError } from "../utils/access.js";
import { recalcProgress } from "../utils/progress.js";
import { createNotification } from "./notificationController.js";
import { quizSummaryFor } from "./moduleController.js";
import { removeUpload } from "../middleware/upload.js";

// Every admin query is narrowed to the courses the admin owns; super admin sees all.
const scopeFor = async (user) => {
  const ids = await managedCourseIds(user);
  const courseFilter = ids === null ? {} : { _id: { $in: ids } };
  const byCourse = ids === null ? {} : { course: { $in: ids } };
  const assignmentIds = (await Assignment.find(byCourse).select("_id")).map((a) => a._id);
  return { ids, courseFilter, byCourse, assignmentIds, bySubmission: ids === null ? {} : { assignment: { $in: assignmentIds } } };
};

// Students the admin is allowed to see: everyone for super admin, otherwise anyone enrolled in their courses
const visibleStudentIds = async (user, scope) => {
  if (scope.ids === null) return null;
  return Enrollment.distinct("student", scope.byCourse);
};

// @route GET /api/admin/overview  — stats, chart data and work queues in one call
export const getOverview = asyncHandler(async (req, res) => {
  const scope = await scopeFor(req.user);
  const studentIds = await visibleStudentIds(req.user, scope);
  const studentFilter = studentIds === null ? { role: "student" } : { _id: { $in: studentIds } };
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

  const [
    studentCount,
    courseCount,
    publishedCount,
    enrollmentCount,
    completedEnrollments,
    assignmentCount,
    submissionCount,
    pendingGrading,
    enrollmentsByCourse,
    submissionStatus,
    enrollmentTrend,
    gradingQueue,
    upcoming,
  ] = await Promise.all([
    User.countDocuments(studentFilter),
    Course.countDocuments(scope.courseFilter),
    Course.countDocuments({ ...scope.courseFilter, isPublished: true }),
    Enrollment.countDocuments(scope.byCourse),
    Enrollment.countDocuments({ ...scope.byCourse, status: "completed" }),
    Assignment.countDocuments(scope.byCourse),
    Submission.countDocuments(scope.bySubmission),
    Submission.countDocuments({ ...scope.bySubmission, status: { $ne: "graded" } }),
    Enrollment.aggregate([
      { $match: scope.byCourse },
      { $group: { _id: "$course", students: { $sum: 1 }, avgProgress: { $avg: "$progress" } } },
      { $lookup: { from: "courses", localField: "_id", foreignField: "_id", as: "course" } },
      { $unwind: "$course" },
      { $project: { _id: 0, courseId: "$_id", title: "$course.title", students: 1, avgProgress: { $round: ["$avgProgress", 0] } } },
      { $sort: { students: -1 } },
    ]),
    Submission.aggregate([
      { $match: scope.bySubmission },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { _id: 0, status: "$_id", count: 1 } },
    ]),
    Enrollment.aggregate([
      { $match: { ...scope.byCourse, enrollmentDate: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$enrollmentDate" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: "$_id", count: 1 } },
    ]),
    Submission.find({ ...scope.bySubmission, status: { $ne: "graded" } })
      .populate("student", "name email")
      .populate({ path: "assignment", select: "title course maximumMarks", populate: { path: "course", select: "title" } })
      .sort({ submissionDate: 1 })
      .limit(8),
    Assignment.find({ ...scope.byCourse, deadline: { $gte: new Date() } })
      .populate("course", "title")
      .sort({ deadline: 1 })
      .limit(6),
  ]);

  res.json({
    stats: {
      studentCount,
      courseCount,
      publishedCount,
      enrollmentCount,
      completionRate: enrollmentCount ? Math.round((completedEnrollments / enrollmentCount) * 100) : 0,
      assignmentCount,
      submissionCount,
      pendingGrading,
      ...(isSuper(req.user)
        ? {
            adminCount: await User.countDocuments({ role: "admin" }),
            userCount: await User.countDocuments({}),
          }
        : {}),
    },
    enrollmentsByCourse,
    submissionStatus,
    enrollmentTrend,
    gradingQueue: gradingQueue.filter((s) => s.assignment && s.student),
    upcoming,
  });
});

// @route GET /api/admin/students
export const getStudents = asyncHandler(async (req, res) => {
  const scope = await scopeFor(req.user);
  const ids = await visibleStudentIds(req.user, scope);
  const filter = ids === null ? { role: "student" } : { _id: { $in: ids }, role: "student" };

  if (req.query.search?.trim()) {
    const s = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [{ name: { $regex: s, $options: "i" } }, { email: { $regex: s, $options: "i" } }];
  }

  const students = await User.find(filter).sort({ createdAt: -1 });
  const agg = await Enrollment.aggregate([
    { $match: { student: { $in: students.map((s) => s._id) }, ...scope.byCourse } },
    { $group: { _id: "$student", courses: { $sum: 1 }, avgProgress: { $avg: "$progress" }, completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } } } },
  ]);
  const map = Object.fromEntries(agg.map((a) => [String(a._id), a]));

  res.json({
    students: students.map((s) => ({
      _id: s._id,
      name: s.name,
      email: s.email,
      avatar: s.avatar,
      isActive: s.isActive !== false,
      createdAt: s.createdAt,
      lastLogin: s.lastLogin,
      courses: map[String(s._id)]?.courses || 0,
      completed: map[String(s._id)]?.completed || 0,
      avgProgress: Math.round(map[String(s._id)]?.avgProgress || 0),
    })),
  });
});

// @route GET /api/admin/students/:id
export const getStudentDetail = asyncHandler(async (req, res) => {
  const student = await User.findById(req.params.id);
  if (!student || student.role !== "student") return res.status(404).json({ message: "Student not found." });

  const scope = await scopeFor(req.user);
  if (scope.ids !== null) {
    const visible = await Enrollment.exists({ student: student._id, ...scope.byCourse });
    if (!visible) return res.status(403).json({ message: "This student isn't enrolled in any of your courses." });
  }

  const [enrollments, submissions, quizzes, managedCourses] = await Promise.all([
    Enrollment.find({ student: student._id, ...scope.byCourse }).populate("course", "title category").sort({ createdAt: -1 }),
    Submission.find({ student: student._id, ...scope.bySubmission })
      .populate({ path: "assignment", select: "title maximumMarks deadline course", populate: { path: "course", select: "title" } })
      .sort({ submissionDate: -1 }),
    quizSummaryFor(student._id, scope.ids),
    Course.find(scope.courseFilter).select("title isPublished").sort({ title: 1 }),
  ]);

  const enrolledIds = new Set(enrollments.map((e) => String(e.course?._id)));
  res.json({
    student: {
      _id: student._id,
      name: student.name,
      email: student.email,
      avatar: student.avatar,
      bio: student.bio,
      department: student.department,
      isActive: student.isActive !== false,
      createdAt: student.createdAt,
      lastLogin: student.lastLogin,
      authProvider: student.authProvider,
    },
    enrollments: enrollments.filter((e) => e.course),
    submissions: submissions.filter((s) => s.assignment),
    quizzes,
    enrollableCourses: managedCourses.filter((c) => !enrolledIds.has(String(c._id))),
  });
});

const assertStudent = async (studentId) => {
  const student = await User.findById(studentId);
  if (!student || student.role !== "student") throw new HttpError(404, "Student not found.");
  return student;
};

// @route POST /api/admin/enrollments  { studentId, courseId }
export const adminEnrollStudent = asyncHandler(async (req, res) => {
  const { studentId, courseId } = req.body;
  if (!studentId || !courseId) return res.status(400).json({ message: "Pick a student and a course." });
  const course = await loadManagedCourse(req.user, courseId);
  const student = await assertStudent(studentId);

  if (await Enrollment.exists({ student: student._id, course: course._id })) {
    return res.status(409).json({ message: "This student is already enrolled in that course." });
  }
  const enrollment = await Enrollment.create({ student: student._id, course: course._id });
  createNotification({
    user: student._id,
    sentBy: req.user._id,
    title: "You were enrolled in a course",
    message: `${req.user.name} enrolled you in ${course.title}.`,
    link: `/dashboard/courses/${course._id}/learn`,
    type: "admin_announcement",
  });
  res.status(201).json({ enrollment });
});

// @route DELETE /api/admin/enrollments/:id
export const adminUnenroll = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findById(req.params.id);
  if (!enrollment) return res.status(404).json({ message: "Enrollment not found." });
  await loadManagedCourse(req.user, enrollment.course);

  const assignmentIds = (await Assignment.find({ course: enrollment.course }).select("_id")).map((a) => a._id);
  const subs = await Submission.find({ student: enrollment.student, assignment: { $in: assignmentIds } }).select("filePath");
  subs.forEach((s) => removeUpload(s.filePath));
  await Promise.all([
    Submission.deleteMany({ student: enrollment.student, assignment: { $in: assignmentIds } }),
    QuizAttempt.deleteMany({ student: enrollment.student, course: enrollment.course }),
    enrollment.deleteOne(),
  ]);
  res.json({ message: "Student removed from the course." });
});

// @route POST /api/admin/enrollments/:id/recalculate — fixes progress after content changes
export const adminRecalcEnrollment = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findById(req.params.id);
  if (!enrollment) return res.status(404).json({ message: "Enrollment not found." });
  await loadManagedCourse(req.user, enrollment.course);
  await recalcProgress(enrollment);
  res.json({ enrollment });
});

// @route GET /api/admin/submissions?status=&course=
export const getSubmissions = asyncHandler(async (req, res) => {
  const scope = await scopeFor(req.user);
  const filter = { ...scope.bySubmission };
  const { status, course } = req.query;

  if (status === "pending") filter.status = { $ne: "graded" };
  else if (["submitted", "late", "graded"].includes(status)) filter.status = status;

  if (course) {
    await loadManagedCourse(req.user, course);
    filter.assignment = { $in: (await Assignment.find({ course }).select("_id")).map((a) => a._id) };
  }

  const submissions = await Submission.find(filter)
    .populate("student", "name email avatar")
    .populate({ path: "assignment", select: "title maximumMarks deadline course", populate: { path: "course", select: "title" } })
    .sort({ submissionDate: -1 });

  res.json({ submissions: submissions.filter((s) => s.assignment && s.student) });
});

// @route POST /api/admin/submissions/:id/reopen — lets the student submit again
export const reopenSubmission = asyncHandler(async (req, res) => {
  const sub = await Submission.findById(req.params.id);
  if (!sub) return res.status(404).json({ message: "Submission not found." });
  const assignment = await Assignment.findById(sub.assignment);
  await loadManagedCourse(req.user, assignment.course);

  removeUpload(sub.filePath);
  await sub.deleteOne();
  createNotification({
    user: sub.student,
    sentBy: req.user._id,
    title: `Resubmission opened: ${assignment.title}`,
    message: "Your instructor reopened this assignment so you can submit again.",
    link: `/dashboard/assignments/${assignment._id}`,
    type: "admin_announcement",
  });
  res.json({ message: "Submission cleared. The student can submit again." });
});

/* ───────────── Super admin only: user management ───────────── */

// @route GET /api/admin/users?search=&role=&status=
export const getAllUsers = asyncHandler(async (req, res) => {
  const { search, role, status } = req.query;
  const query = {};
  if (search?.trim()) {
    const s = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = [{ name: { $regex: s, $options: "i" } }, { email: { $regex: s, $options: "i" } }];
  }
  if (role === "superadmin") query.isSuperAdmin = true;
  else if (["student", "admin"].includes(role)) query.role = role;
  if (status === "active") query.isActive = { $ne: false };
  else if (status === "deactivated") query.isActive = false;

  const users = await User.find(query).sort({ createdAt: -1 });
  const owned = await Course.aggregate([{ $group: { _id: "$createdBy", n: { $sum: 1 } } }]);
  const ownedMap = Object.fromEntries(owned.map((o) => [String(o._id), o.n]));
  res.json({
    users: users.map((u) => ({ ...u.toObject(), courseCount: ownedMap[String(u._id)] || 0 })),
  });
});

// @route GET /api/admin/instructors  — admins that can own courses (for the owner picker)
export const getInstructors = asyncHandler(async (req, res) => {
  const admins = await User.find({ role: "admin", isActive: { $ne: false } }).select("name email isSuperAdmin").sort({ name: 1 });
  res.json({ instructors: admins });
});

// @route POST /api/admin/users  { name, email, password, role }
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ message: "Name, email and a temporary password are required." });
  }
  if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters." });
  if (!["student", "admin", "superadmin"].includes(role)) return res.status(400).json({ message: "Pick a role." });
  if (await User.exists({ email: email.toLowerCase().trim() })) {
    return res.status(409).json({ message: "An account with this email already exists." });
  }
  const user = await User.create({
    name: name.trim(),
    email,
    password,
    role: role === "student" ? "student" : "admin",
    isSuperAdmin: role === "superadmin",
  });
  res.status(201).json({ user, message: `${user.name} can now sign in.` });
});

const loadOtherUser = async (req) => {
  if (String(req.user._id) === String(req.params.id)) {
    throw new HttpError(400, "You can't change your own account from here.");
  }
  const user = await User.findById(req.params.id);
  if (!user) throw new HttpError(404, "User not found.");
  return user;
};

// Never leave the platform without a super admin
const assertNotLastSuper = async (user) => {
  if (!user.isSuperAdmin) return;
  const supers = await User.countDocuments({ isSuperAdmin: true, isActive: { $ne: false } });
  if (supers <= 1) throw new HttpError(400, "There must always be at least one active super admin.");
};

// @route PUT /api/admin/users/:id/role  { role: student | admin | superadmin }
export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!["student", "admin", "superadmin"].includes(role)) {
    return res.status(400).json({ message: "Role must be student, admin or superadmin." });
  }
  const user = await loadOtherUser(req);
  if (role !== "superadmin") await assertNotLastSuper(user);

  if (role === "student" && user.role === "admin") {
    // Hand their courses to the super admin making the change so nothing is orphaned
    await Course.updateMany({ createdBy: user._id }, { createdBy: req.user._id });
  }

  user.role = role === "student" ? "student" : "admin";
  user.isSuperAdmin = role === "superadmin";
  await user.save();
  const label = { student: "a student", admin: "an instructor", superadmin: "a super admin" }[role];
  res.json({ user, message: `${user.name} is now ${label}.` });
});

// @route PUT /api/admin/users/:id/status — toggles active / deactivated
export const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await loadOtherUser(req);
  if (user.isActive !== false) await assertNotLastSuper(user);
  user.isActive = user.isActive === false;
  await user.save();
  res.json({ user, message: `${user.name}'s account is now ${user.isActive ? "active" : "deactivated"}.` });
});

// @route DELETE /api/admin/users/:id
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await loadOtherUser(req);
  await assertNotLastSuper(user);

  const subs = await Submission.find({ student: user._id }).select("filePath");
  subs.forEach((s) => removeUpload(s.filePath));
  removeUpload(user.avatar);

  await Promise.all([
    Enrollment.deleteMany({ student: user._id }),
    Submission.deleteMany({ student: user._id }),
    QuizAttempt.deleteMany({ student: user._id }),
    Notification.deleteMany({ user: user._id }),
    Discussion.deleteMany({ user: user._id }),
    Discussion.updateMany({}, { $pull: { replies: { user: user._id }, upvotes: user._id } }),
    Course.updateMany({ createdBy: user._id }, { createdBy: req.user._id }),
  ]);
  await user.deleteOne();
  res.json({ message: `${user.name}'s account and records were deleted.` });
});

// @route POST /api/admin/notifications  { title, message, link, audience, userId, courseId }
// Admins can message students in their own courses; super admin can message anyone.
export const sendAdminNotification = asyncHandler(async (req, res) => {
  const { title, message, link, audience, userId, courseId } = req.body;
  if (!title?.trim() || !message?.trim()) {
    return res.status(400).json({ message: "Title and message are required." });
  }
  const scope = await scopeFor(req.user);
  const superUser = isSuper(req.user);
  let recipients = [];

  if (audience === "course") {
    if (!courseId) return res.status(400).json({ message: "Pick a course." });
    await loadManagedCourse(req.user, courseId);
    recipients = await Enrollment.distinct("student", { course: courseId });
  } else if (audience === "specific") {
    if (!userId) return res.status(400).json({ message: "Pick a person to notify." });
    if (!superUser) {
      const visible = await Enrollment.exists({ student: userId, ...scope.byCourse });
      if (!visible) return res.status(403).json({ message: "You can only message students in your courses." });
    }
    recipients = [userId];
  } else if (audience === "students") {
    recipients = superUser ? await User.distinct("_id", { role: "student" }) : await Enrollment.distinct("student", scope.byCourse);
  } else if (superUser && audience === "admins") {
    recipients = await User.distinct("_id", { role: "admin" });
  } else if (superUser && audience === "all") {
    recipients = await User.distinct("_id", {});
  } else {
    return res.status(400).json({ message: "Pick who should receive this." });
  }

  await Promise.all(
    recipients.map((id) =>
      createNotification({
        user: id,
        sentBy: req.user._id,
        title: title.trim(),
        message: message.trim(),
        link: link?.trim() || "",
        type: "admin_announcement",
      })
    )
  );

  res.status(201).json({ message: `Sent to ${recipients.length} ${recipients.length === 1 ? "person" : "people"}.` });
});

// @route GET /api/admin/directory?search=  — lightweight student lookup so any admin can enroll someone by name/email
export const studentDirectory = asyncHandler(async (req, res) => {
  const filter = { role: "student", isActive: { $ne: false } };
  if (req.query.search?.trim()) {
    const s = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [{ name: { $regex: s, $options: "i" } }, { email: { $regex: s, $options: "i" } }];
  }
  const students = await User.find(filter).select("name email avatar").sort({ name: 1 }).limit(20);
  res.json({ students });
});
