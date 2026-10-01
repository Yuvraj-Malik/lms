import User from "../models/User.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Assignment from "../models/Assignment.js";
import Submission from "../models/Submission.js";
import QuizAttempt from "../models/QuizAttempt.js";
import Discussion from "../models/Discussion.js";
import Notification from "../models/Notification.js";
import Module from "../models/Module.js";
import AuditLog from "../models/AuditLog.js";
import { audit } from "../utils/audit.js";
import { getSettings, clearSettingsCache } from "../utils/settings.js";
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

// @route GET /api/admin/overview  — stats, a per-course table and work queues in one call
export const getOverview = asyncHandler(async (req, res) => {
  const scope = await scopeFor(req.user);
  const superUser = isSuper(req.user);
  const studentIds = await visibleStudentIds(req.user, scope);
  const studentFilter = studentIds === null ? { role: "student" } : { _id: { $in: studentIds } };
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

  const courses = await Course.find(scope.courseFilter).populate("createdBy", "name").sort({ title: 1 });
  const courseIds = courses.map((c) => c._id);
  const assignments = await Assignment.find({ course: { $in: courseIds } }).select("course deadline title");
  const assignmentCourse = Object.fromEntries(assignments.map((a) => [String(a._id), String(a.course)]));

  const [
    studentCount,
    enrollAgg,
    moduleAgg,
    pendingAgg,
    submissionCount,
    submissionStatus,
    enrollmentTrend,
    gradingQueue,
    upcoming,
  ] = await Promise.all([
    User.countDocuments(studentFilter),
    Enrollment.aggregate([
      { $match: { course: { $in: courseIds } } },
      {
        $group: {
          _id: "$course",
          students: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          avgProgress: { $avg: "$progress" },
        },
      },
    ]),
    Module.aggregate([{ $match: { course: { $in: courseIds } } }, { $group: { _id: "$course", n: { $sum: 1 } } }]),
    Submission.aggregate([
      { $match: { assignment: { $in: assignments.map((a) => a._id) }, status: { $ne: "graded" } } },
      { $group: { _id: "$assignment", n: { $sum: 1 } } },
    ]),
    Submission.countDocuments({ assignment: { $in: assignments.map((a) => a._id) } }),
    Submission.aggregate([
      { $match: { assignment: { $in: assignments.map((a) => a._id) } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { _id: 0, status: "$_id", count: 1 } },
    ]),
    Enrollment.aggregate([
      { $match: { course: { $in: courseIds }, enrollmentDate: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$enrollmentDate" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: "$_id", count: 1 } },
    ]),
    Submission.find({ assignment: { $in: assignments.map((a) => a._id) }, status: { $ne: "graded" } })
      .populate("student", "name email")
      .populate({ path: "assignment", select: "title course maximumMarks", populate: { path: "course", select: "title" } })
      .sort({ submissionDate: 1 })
      .limit(6),
    Assignment.find({ course: { $in: courseIds }, deadline: { $gte: new Date() } })
      .populate("course", "title")
      .sort({ deadline: 1 })
      .limit(6),
  ]);

  const byCourse = (arr) => Object.fromEntries(arr.map((x) => [String(x._id), x]));
  const enr = byCourse(enrollAgg);
  const mods = byCourse(moduleAgg);
  const pendingByCourse = {};
  pendingAgg.forEach((p) => {
    const c = assignmentCourse[String(p._id)];
    pendingByCourse[c] = (pendingByCourse[c] || 0) + p.n;
  });
  const now = new Date();
  const nextDeadline = {};
  assignments
    .filter((a) => a.deadline >= now)
    .forEach((a) => {
      const c = String(a.course);
      if (!nextDeadline[c] || a.deadline < nextDeadline[c]) nextDeadline[c] = a.deadline;
    });

  const courseRows = courses.map((c) => {
    const id = String(c._id);
    return {
      _id: c._id,
      title: c.title,
      category: c.category,
      isPublished: c.isPublished,
      owner: c.createdBy ? { _id: c.createdBy._id, name: c.createdBy.name } : null,
      modules: mods[id]?.n || 0,
      students: enr[id]?.students || 0,
      completed: enr[id]?.completed || 0,
      avgProgress: Math.round(enr[id]?.avgProgress || 0),
      pendingGrading: pendingByCourse[id] || 0,
      nextDeadline: nextDeadline[id] || null,
    };
  });

  const enrollmentCount = enrollAgg.reduce((n, e) => n + e.students, 0);
  const completedCount = enrollAgg.reduce((n, e) => n + e.completed, 0);
  const pendingGrading = pendingAgg.reduce((n, p) => n + p.n, 0);

  const payload = {
    stats: {
      studentCount,
      courseCount: courses.length,
      publishedCount: courses.filter((c) => c.isPublished).length,
      enrollmentCount,
      completionRate: enrollmentCount ? Math.round((completedCount / enrollmentCount) * 100) : 0,
      assignmentCount: assignments.length,
      submissionCount,
      pendingGrading,
    },
    courses: courseRows,
    submissionStatus,
    enrollmentTrend,
    gradingQueue: gradingQueue.filter((s) => s.assignment && s.student),
    upcoming,
  };

  if (superUser) {
    const [userCounts, signupTrend, instructors, recentActivity] = await Promise.all([
      User.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            students: { $sum: { $cond: [{ $eq: ["$role", "student"] }, 1, 0] } },
            instructors: { $sum: { $cond: [{ $and: [{ $eq: ["$role", "admin"] }, { $ne: ["$isSuperAdmin", true] }] }, 1, 0] } },
            supers: { $sum: { $cond: [{ $eq: ["$isSuperAdmin", true] }, 1, 0] } },
            deactivated: { $sum: { $cond: [{ $eq: ["$isActive", false] }, 1, 0] } },
          },
        },
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: "$_id", count: 1 } },
      ]),
      User.find({ role: "admin" }).select("name email isSuperAdmin isActive lastLogin").sort({ name: 1 }),
      AuditLog.find({}).sort({ createdAt: -1 }).limit(6),
    ]);

    payload.users = userCounts[0] || { total: 0, students: 0, instructors: 0, supers: 0, deactivated: 0 };
    payload.signupTrend = signupTrend;
    payload.recentActivity = recentActivity;
    payload.instructors = instructors.map((i) => {
      const mine = courseRows.filter((c) => String(c.owner?._id) === String(i._id));
      return {
        _id: i._id,
        name: i.name,
        email: i.email,
        isSuperAdmin: i.isSuperAdmin,
        isActive: i.isActive !== false,
        lastLogin: i.lastLogin,
        courses: mine.length,
        published: mine.filter((c) => c.isPublished).length,
        students: mine.reduce((n, c) => n + c.students, 0),
        pendingGrading: mine.reduce((n, c) => n + c.pendingGrading, 0),
      };
    });
  }

  res.json(payload);
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
  audit(req, "enrollment.add", `Enrolled ${student.name} in ${course.title}`, { targetType: "user", targetId: student._id, link: `/admin/students/${student._id}` });
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
  const enrollment = await Enrollment.findById(req.params.id).populate("student", "name");
  if (!enrollment) return res.status(404).json({ message: "Enrollment not found." });
  const course = await loadManagedCourse(req.user, enrollment.course);
  audit(req, "enrollment.remove", `Removed ${enrollment.student?.name} from ${course.title}`, { targetType: "course", targetId: course._id, link: `/admin/courses/${course._id}?tab=students` });

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
  audit(req, "submission.reopen", `Reopened a submission for "${assignment.title}"`, { targetType: "course", targetId: assignment.course, link: `/admin/courses/${assignment.course}?tab=submissions` });
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
  audit(req, "user.create", `Created ${role === "student" ? "student" : role === "admin" ? "instructor" : "super admin"} account for ${user.name} (${user.email})`, { targetType: "user", targetId: user._id });
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
  audit(req, "user.role", `Made ${user.name} ${label}`, { targetType: "user", targetId: user._id });
  res.json({ user, message: `${user.name} is now ${label}.` });
});

// @route PUT /api/admin/users/:id/status — toggles active / deactivated
export const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await loadOtherUser(req);
  if (user.isActive !== false) await assertNotLastSuper(user);
  user.isActive = user.isActive === false;
  await user.save();
  audit(req, user.isActive ? "user.activate" : "user.deactivate", `${user.isActive ? "Reactivated" : "Deactivated"} ${user.name}`, { targetType: "user", targetId: user._id });
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
  audit(req, "user.delete", `Deleted ${user.name} (${user.email}) and their records`, { targetType: "user" });
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

  audit(req, "notification.send", `Sent "${title.trim()}" to ${recipients.length} ${recipients.length === 1 ? "person" : "people"}`, { targetType: "notification" });
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

// @route PUT /api/admin/users/:id  { name, email, department }  (super admin)
export const updateUserDetails = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found." });
  const { name, email, department } = req.body;

  if (name !== undefined) {
    if (!String(name).trim()) return res.status(400).json({ message: "Name can't be empty." });
    user.name = String(name).trim().slice(0, 80);
  }
  if (email !== undefined) {
    const clean = String(email).toLowerCase().trim();
    if (!/^\S+@\S+\.\S+$/.test(clean)) return res.status(400).json({ message: "Enter a valid email address." });
    if (clean !== user.email && (await User.exists({ email: clean }))) {
      return res.status(409).json({ message: "Another account already uses that email." });
    }
    user.email = clean;
  }
  if (department !== undefined) user.department = String(department).trim().slice(0, 120);

  await user.save();
  audit(req, "user.update", `Edited ${user.name}'s account details`, { targetType: "user", targetId: user._id });
  res.json({ user, message: "Account updated." });
});

// @route POST /api/admin/users/:id/password  { password }  (super admin sets a new password)
export const setUserPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters." });
  const user = await User.findById(req.params.id).select("+password");
  if (!user) return res.status(404).json({ message: "User not found." });
  user.password = password;
  await user.save();
  audit(req, "user.password", `Set a new password for ${user.name}`, { targetType: "user", targetId: user._id });
  res.json({ message: `${user.name}'s password was changed. Share it with them securely.` });
});

// @route GET /api/admin/settings  (super admin)
export const getPlatformSettings = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  await settings.populate("updatedBy", "name");
  res.json({ settings, envInstructorCode: !!process.env.ADMIN_SIGNUP_CODE });
});

// @route PUT /api/admin/settings  (super admin)
export const updatePlatformSettings = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  const b = req.body;
  ["registrationOpen", "googleSignInEnabled", "instructorSignupEnabled", "instructorsCanPublish", "allowLateSubmissions"].forEach((k) => {
    if (typeof b[k] === "boolean") settings[k] = b[k];
  });
  if (b.platformName !== undefined) {
    if (!String(b.platformName).trim()) return res.status(400).json({ message: "Platform name can't be empty." });
    settings.platformName = String(b.platformName).trim().slice(0, 60);
  }
  if (b.instructorSignupCode !== undefined) {
    const code = String(b.instructorSignupCode).trim();
    if (code && code.length < 8) return res.status(400).json({ message: "Use an access code of at least 8 characters." });
    settings.instructorSignupCode = code;
  }
  if (b.defaultQuizPassPercent !== undefined) {
    const n = Number(b.defaultQuizPassPercent);
    if (!Number.isFinite(n) || n < 0 || n > 100) return res.status(400).json({ message: "Pass mark must be between 0 and 100." });
    settings.defaultQuizPassPercent = n;
  }
  if (b.banner) {
    const banner = {
      active: !!b.banner.active,
      message: String(b.banner.message || "").trim().slice(0, 280),
      tone: ["info", "warn", "danger", "ok"].includes(b.banner.tone) ? b.banner.tone : "info",
    };
    if (banner.active && !banner.message) {
      return res.status(400).json({ message: "Write a message for the banner, or turn it off." });
    }
    settings.banner = banner;
  }
  settings.updatedBy = req.user._id;
  await settings.save();
  clearSettingsCache();
  audit(req, "settings.update", "Changed platform settings", { targetType: "settings", link: "/admin/platform" });
  await settings.populate("updatedBy", "name");
  res.json({ settings, message: "Platform settings saved." });
});

// @route GET /api/admin/audit?action=&actor=&before=  (super admin)
export const getAuditLog = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.action) filter.action = { $regex: `^${String(req.query.action).replace(/[^a-z.]/gi, "")}` };
  if (req.query.actor) filter.actor = req.query.actor;
  if (req.query.before) filter.createdAt = { $lt: new Date(req.query.before) };
  const limit = 50;
  const entries = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(limit + 1);
  const actors = await User.find({ _id: { $in: await AuditLog.distinct("actor") } }).select("name").sort({ name: 1 });
  res.json({ entries: entries.slice(0, limit), hasMore: entries.length > limit, actors });
});
