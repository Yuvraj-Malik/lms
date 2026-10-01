import Assignment from "../models/Assignment.js";
import Submission from "../models/Submission.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ownsCourse, loadManagedCourse, HttpError } from "../utils/access.js";
import { createNotification } from "./notificationController.js";
import { removeUpload } from "../middleware/upload.js";
import { audit } from "../utils/audit.js";

const readAssignmentFields = (body, { partial }) => {
  const out = {};
  if (body.title !== undefined || !partial) {
    if (!String(body.title || "").trim()) throw new HttpError(400, "Title is required.");
    out.title = String(body.title).trim();
  }
  if (body.description !== undefined) out.description = String(body.description);
  if (body.instructions !== undefined) out.instructions = String(body.instructions);
  if (body.deadline !== undefined || !partial) {
    const d = new Date(body.deadline);
    if (!body.deadline || isNaN(d.getTime())) throw new HttpError(400, "A valid deadline is required.");
    out.deadline = d;
  }
  if (body.maximumMarks !== undefined && body.maximumMarks !== "") {
    const marks = Number(body.maximumMarks);
    if (!Number.isFinite(marks) || marks <= 0) throw new HttpError(400, "Maximum marks must be a positive number.");
    out.maximumMarks = marks;
  }
  return out;
};

// Throws unless the user manages the course or is an enrolled student
const assertCourseAccess = async (user, course) => {
  if (ownsCourse(user, course)) return "manager";
  if (user.role === "student") {
    const enrolled = await Enrollment.exists({ student: user._id, course: course._id });
    if (enrolled) return "student";
  }
  throw new HttpError(403, "You don't have access to this course.");
};

// @route GET /api/courses/:courseId/assignments
export const getAssignmentsForCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) return res.status(404).json({ message: "Course not found." });
  const role = await assertCourseAccess(req.user, course);

  const assignments = await Assignment.find({ course: course._id }).sort({ deadline: 1 });
  const ids = assignments.map((a) => a._id);

  if (role === "student") {
    const subs = await Submission.find({ assignment: { $in: ids }, student: req.user._id });
    const subMap = Object.fromEntries(subs.map((s) => [String(s.assignment), s]));
    return res.json({
      assignments: assignments.map((a) => ({ ...a.toObject(), mySubmission: subMap[String(a._id)] || null })),
    });
  }

  // Managers: attach submission / grading counts
  const counts = await Submission.aggregate([
    { $match: { assignment: { $in: ids } } },
    {
      $group: {
        _id: "$assignment",
        submitted: { $sum: 1 },
        graded: { $sum: { $cond: [{ $eq: ["$status", "graded"] }, 1, 0] } },
      },
    },
  ]);
  const cMap = Object.fromEntries(counts.map((c) => [String(c._id), c]));
  res.json({
    assignments: assignments.map((a) => ({
      ...a.toObject(),
      submittedCount: cMap[String(a._id)]?.submitted || 0,
      gradedCount: cMap[String(a._id)]?.graded || 0,
    })),
  });
});

// @route GET /api/assignments/my  (student: every assignment across enrolled courses)
export const getMyAssignments = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ student: req.user._id }).select("course");
  const courseIds = enrollments.map((e) => e.course);

  const [assignments, subs] = await Promise.all([
    Assignment.find({ course: { $in: courseIds } }).populate("course", "title").sort({ deadline: 1 }),
    Submission.find({ student: req.user._id }),
  ]);
  const subMap = Object.fromEntries(subs.map((s) => [String(s.assignment), s]));

  res.json({
    assignments: assignments
      .filter((a) => a.course)
      .map((a) => ({ ...a.toObject(), mySubmission: subMap[String(a._id)] || null })),
  });
});

// @route GET /api/assignments/:id
export const getAssignmentById = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id).populate("course", "title createdBy");
  if (!assignment || !assignment.course) return res.status(404).json({ message: "Assignment not found." });
  const role = await assertCourseAccess(req.user, assignment.course);

  let mySubmission = null;
  if (role === "student") {
    mySubmission = await Submission.findOne({ assignment: assignment._id, student: req.user._id });
  }
  res.json({ assignment, mySubmission, canManage: role === "manager" });
});

// @route POST /api/courses/:courseId/assignments (owner / super admin)
export const createAssignment = asyncHandler(async (req, res) => {
  const course = await loadManagedCourse(req.user, req.params.courseId);
  const fields = readAssignmentFields(req.body, { partial: false });

  const assignment = await Assignment.create({ course: course._id, ...fields });

  const enrollments = await Enrollment.find({ course: course._id }).select("student");
  await Promise.all(
    enrollments.map((enr) =>
      createNotification({
        user: enr.student,
        sentBy: req.user._id,
        title: `New assignment in ${course.title}`,
        message: `${assignment.title} — due ${assignment.deadline.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}.`,
        link: `/dashboard/assignments/${assignment._id}`,
        type: "assignment_new",
      })
    )
  );

  audit(req, "assignment.create", `Posted "${assignment.title}" in ${course.title}`, { targetType: "course", targetId: course._id, link: `/admin/courses/${course._id}?tab=assignments` });
  res.status(201).json({ assignment });
});

// @route PUT /api/assignments/:id (owner / super admin)
export const updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) return res.status(404).json({ message: "Assignment not found." });
  await loadManagedCourse(req.user, assignment.course);

  Object.assign(assignment, readAssignmentFields(req.body, { partial: true }));
  await assignment.save();
  audit(req, "assignment.update", `Edited assignment "${assignment.title}"`, { targetType: "course", targetId: assignment.course, link: `/admin/courses/${assignment.course}?tab=assignments` });
  res.json({ assignment });
});

// @route DELETE /api/assignments/:id (owner / super admin)
export const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) return res.status(404).json({ message: "Assignment not found." });
  await loadManagedCourse(req.user, assignment.course);

  const subs = await Submission.find({ assignment: assignment._id }).select("filePath");
  subs.forEach((s) => removeUpload(s.filePath));
  await Submission.deleteMany({ assignment: assignment._id });
  await assignment.deleteOne();
  audit(req, "assignment.delete", `Deleted assignment "${assignment.title}" (${subs.length} submissions)`, { targetType: "course", targetId: assignment.course, link: `/admin/courses/${assignment.course}?tab=assignments` });

  res.json({ message: "Assignment and its submissions deleted." });
});
