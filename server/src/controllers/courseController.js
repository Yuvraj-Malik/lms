import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Module from "../models/Module.js";
import Assignment from "../models/Assignment.js";
import Submission from "../models/Submission.js";
import Discussion from "../models/Discussion.js";
import QuizAttempt from "../models/QuizAttempt.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import { isSuper, ownsCourse, loadManagedCourse, managedCourseIds } from "../utils/access.js";

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];
const toBool = (v) => v === true || v === "true" || v === "1" || v === 1;

// Attach moduleCount / enrolledCount / assignmentCount to a list of courses in 3 queries
const withCounts = async (courses) => {
  const ids = courses.map((c) => c._id);
  const [mods, enrs, asgs] = await Promise.all([
    Module.aggregate([{ $match: { course: { $in: ids } } }, { $group: { _id: "$course", n: { $sum: 1 } } }]),
    Enrollment.aggregate([{ $match: { course: { $in: ids } } }, { $group: { _id: "$course", n: { $sum: 1 } } }]),
    Assignment.aggregate([{ $match: { course: { $in: ids } } }, { $group: { _id: "$course", n: { $sum: 1 } } }]),
  ]);
  const m = (arr) => Object.fromEntries(arr.map((x) => [String(x._id), x.n]));
  const [mm, em, am] = [m(mods), m(enrs), m(asgs)];
  return courses.map((c) => ({
    ...(c.toObject ? c.toObject() : c),
    moduleCount: mm[String(c._id)] || 0,
    enrolledCount: em[String(c._id)] || 0,
    assignmentCount: am[String(c._id)] || 0,
  }));
};

// @route GET /api/courses  (public catalog — published courses only)
// Supports ?search=&category=&difficulty=&sort=
export const getCourses = asyncHandler(async (req, res) => {
  const { search, category, difficulty, sort } = req.query;
  const query = { isPublished: true };

  if (search?.trim()) {
    const s = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = [
      { title: { $regex: s, $options: "i" } },
      { description: { $regex: s, $options: "i" } },
      { category: { $regex: s, $options: "i" } },
      { instructor: { $regex: s, $options: "i" } },
    ];
  }
  if (category) query.category = category;
  if (difficulty) query.difficulty = difficulty;

  const sortMap = { newest: { createdAt: -1 }, oldest: { createdAt: 1 }, title: { title: 1 } };
  const courses = await Course.find(query).sort(sortMap[sort] || { createdAt: -1 });
  const enriched = await withCounts(courses);
  res.json({ courses: enriched, count: enriched.length });
});

// @route GET /api/courses/categories
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Course.distinct("category", { isPublished: true });
  res.json({ categories: categories.sort() });
});

// @route GET /api/courses/manage  (admin: own courses, super admin: all, incl. drafts)
export const getManagedCourses = asyncHandler(async (req, res) => {
  const ids = await managedCourseIds(req.user);
  const filter = ids === null ? {} : { _id: { $in: ids } };
  const courses = await Course.find(filter).populate("createdBy", "name email").sort({ updatedAt: -1 });
  const enriched = await withCounts(courses);
  res.json({ courses: enriched });
});

// @route GET /api/courses/:id  (public outline; full access info when logged in)
export const getCourseById = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id).populate("createdBy", "name email");
  if (!course) return res.status(404).json({ message: "Course not found." });

  const canManage = ownsCourse(req.user, { createdBy: course.createdBy?._id || course.createdBy });
  if (!course.isPublished && !canManage) {
    return res.status(404).json({ message: "Course not found." });
  }

  const [modules, assignments, enrolledCount, enrollment] = await Promise.all([
    Module.find({ course: course._id }).sort({ moduleOrder: 1 }).select("title description moduleOrder quiz"),
    Assignment.find({ course: course._id }).sort({ deadline: 1 }).select("title deadline maximumMarks"),
    Enrollment.countDocuments({ course: course._id }),
    req.user?.role === "student" ? Enrollment.findOne({ course: course._id, student: req.user._id }) : null,
  ]);

  // Outline only: never expose notes, resources or quiz answers here
  const outline = modules.map((m) => ({
    _id: m._id,
    title: m.title,
    description: m.description,
    moduleOrder: m.moduleOrder,
    quizCount: m.quiz?.length || 0,
  }));

  res.json({
    course,
    modules: outline,
    assignments,
    counts: { moduleCount: modules.length, assignmentCount: assignments.length, enrolledCount },
    access: { canManage, enrolled: !!enrollment, enrollment },
  });
});

const readCourseFields = (body) => {
  const out = {};
  ["title", "description", "category", "instructor", "duration"].forEach((f) => {
    if (body[f] !== undefined) out[f] = String(body[f]).trim();
  });
  if (body.difficulty !== undefined) {
    if (!DIFFICULTIES.includes(body.difficulty)) {
      const err = new Error("Difficulty must be Beginner, Intermediate or Advanced.");
      err.statusCode = 400;
      throw err;
    }
    out.difficulty = body.difficulty;
  }
  if (body.isPublished !== undefined) out.isPublished = toBool(body.isPublished);
  return out;
};

// Super admin may hand a course to another instructor
const resolveOwner = async (req, fallback) => {
  if (!isSuper(req.user) || !req.body.owner) return fallback;
  const owner = await User.findOne({ _id: req.body.owner, role: "admin" });
  if (!owner) {
    const err = new Error("Course owner must be an existing admin.");
    err.statusCode = 400;
    throw err;
  }
  return owner._id;
};

// @route POST /api/courses (admin)
export const createCourse = asyncHandler(async (req, res) => {
  const fields = readCourseFields(req.body);
  const missing = ["title", "description", "category", "instructor", "duration"].filter((f) => !fields[f]);
  if (missing.length) {
    return res.status(400).json({ message: `Missing required fields: ${missing.join(", ")}.` });
  }

  const course = await Course.create({
    ...fields,
    image: req.file ? `/uploads/course-images/${req.file.filename}` : "",
    createdBy: await resolveOwner(req, req.user._id),
  });
  res.status(201).json({ course });
});

// @route PUT /api/courses/:id (owner or super admin)
export const updateCourse = asyncHandler(async (req, res) => {
  const course = await loadManagedCourse(req.user, req.params.id);
  Object.assign(course, readCourseFields(req.body));
  if (req.file) course.image = `/uploads/course-images/${req.file.filename}`;
  if (toBool(req.body.removeImage)) course.image = "";
  course.createdBy = await resolveOwner(req, course.createdBy);
  await course.save();
  res.json({ course });
});

// @route DELETE /api/courses/:id (owner or super admin)
export const deleteCourse = asyncHandler(async (req, res) => {
  const course = await loadManagedCourse(req.user, req.params.id);

  const assignmentIds = (await Assignment.find({ course: course._id }).select("_id")).map((a) => a._id);

  await Promise.all([
    Module.deleteMany({ course: course._id }),
    Assignment.deleteMany({ course: course._id }),
    Submission.deleteMany({ assignment: { $in: assignmentIds } }),
    Enrollment.deleteMany({ course: course._id }),
    Discussion.deleteMany({ course: course._id }),
    QuizAttempt.deleteMany({ course: course._id }),
    course.deleteOne(),
  ]);

  res.json({ message: "Course and all related data deleted." });
});
