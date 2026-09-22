import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Module from "../models/Module.js";
import Assignment from "../models/Assignment.js";
import Submission from "../models/Submission.js";
import asyncHandler from "../utils/asyncHandler.js";

// @route GET /api/courses
// Supports ?search=&category=&difficulty=&sort=
export const getCourses = asyncHandler(async (req, res) => {
  const { search, category, difficulty, sort } = req.query;
  const query = { isPublished: true };

  if (search?.trim()) {
    const s = search.trim();
    query.$or = [
      { title: { $regex: s, $options: "i" } },
      { description: { $regex: s, $options: "i" } },
      { category: { $regex: s, $options: "i" } },
      { instructor: { $regex: s, $options: "i" } },
    ];
  }
  if (category) query.category = category;
  if (difficulty) query.difficulty = difficulty;

  let cursor = Course.find(query);

  if (sort === "newest") cursor = cursor.sort({ createdAt: -1 });
  else if (sort === "oldest") cursor = cursor.sort({ createdAt: 1 });
  else if (sort === "title") cursor = cursor.sort({ title: 1 });
  else cursor = cursor.sort({ createdAt: -1 });

  const courses = await cursor;
  res.json({ courses, count: courses.length });
});

// @route GET /api/courses/categories  (distinct list, for filter dropdown)
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Course.distinct("category", { isPublished: true });
  res.json({ categories });
});

// @route GET /api/courses/:id
export const getCourseById = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ message: "Course not found." });

  const moduleCount = await Module.countDocuments({ course: course._id });
  const assignmentCount = await Assignment.countDocuments({ course: course._id });
  const enrolledCount = await Enrollment.countDocuments({ course: course._id });

  res.json({ course, moduleCount, assignmentCount, enrolledCount });
});

// @route POST /api/courses (admin)
export const createCourse = asyncHandler(async (req, res) => {
  const { title, description, category, instructor, duration, difficulty } = req.body;
  if (!title || !description || !category || !instructor || !duration) {
    return res.status(400).json({ message: "Title, description, category, instructor and duration are required." });
  }

  const image = req.file ? `/uploads/course-images/${req.file.filename}` : "";

  const course = await Course.create({
    title,
    description,
    category,
    instructor,
    duration,
    difficulty,
    image,
    createdBy: req.user._id,
  });

  res.status(201).json({ course });
});

// @route PUT /api/courses/:id (admin)
export const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ message: "Course not found." });

  const fields = ["title", "description", "category", "instructor", "duration", "difficulty", "isPublished"];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) course[f] = req.body[f];
  });

  if (req.file) course.image = `/uploads/course-images/${req.file.filename}`;

  await course.save();
  res.json({ course });
});

// @route DELETE /api/courses/:id (admin)
export const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ message: "Course not found." });

  const modules = await Module.find({ course: course._id }).select("_id");
  const moduleIds = modules.map((m) => m._id);
  const assignments = await Assignment.find({ course: course._id }).select("_id");
  const assignmentIds = assignments.map((a) => a._id);

  await Promise.all([
    Module.deleteMany({ course: course._id }),
    Assignment.deleteMany({ course: course._id }),
    Submission.deleteMany({ assignment: { $in: assignmentIds } }),
    Enrollment.deleteMany({ course: course._id }),
    course.deleteOne(),
  ]);

  res.json({ message: "Course and all related data deleted." });
});
