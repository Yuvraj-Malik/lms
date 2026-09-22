import Module from "../models/Module.js";
import Enrollment from "../models/Enrollment.js";
import asyncHandler from "../utils/asyncHandler.js";
import { recalcProgress } from "../utils/progress.js";

// @route GET /api/courses/:courseId/modules
export const getModulesForCourse = asyncHandler(async (req, res) => {
  const modules = await Module.find({ course: req.params.courseId }).sort({ moduleOrder: 1 });
  res.json({ modules });
});

// @route POST /api/courses/:courseId/modules (admin)
export const createModule = asyncHandler(async (req, res) => {
  const { title, description, notes, resourceLinks, moduleOrder } = req.body;
  if (!title) return res.status(400).json({ message: "Module title is required." });

  const count = await Module.countDocuments({ course: req.params.courseId });

  const module = await Module.create({
    course: req.params.courseId,
    title,
    description,
    notes,
    resourceLinks: Array.isArray(resourceLinks) ? resourceLinks : resourceLinks ? [resourceLinks] : [],
    moduleOrder: moduleOrder ?? count + 1,
  });

  res.status(201).json({ module });
});

// @route PUT /api/modules/:id (admin)
export const updateModule = asyncHandler(async (req, res) => {
  const module = await Module.findById(req.params.id);
  if (!module) return res.status(404).json({ message: "Module not found." });

  const fields = ["title", "description", "notes", "resourceLinks", "moduleOrder"];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) module[f] = req.body[f];
  });

  await module.save();
  res.json({ module });
});

// @route DELETE /api/modules/:id (admin)
export const deleteModule = asyncHandler(async (req, res) => {
  const module = await Module.findById(req.params.id);
  if (!module) return res.status(404).json({ message: "Module not found." });

  await module.deleteOne();

  // Clean references from any enrollment's completedModules + recalc progress
  const enrollments = await Enrollment.find({ course: module.course, completedModules: module._id });
  for (const enr of enrollments) {
    enr.completedModules = enr.completedModules.filter((m) => String(m) !== String(module._id));
    await enr.save();
    await recalcProgress(enr);
  }

  res.json({ message: "Module deleted." });
});

// @route POST /api/modules/:id/complete  (student marks module complete)
export const markModuleComplete = asyncHandler(async (req, res) => {
  const module = await Module.findById(req.params.id);
  if (!module) return res.status(404).json({ message: "Module not found." });

  const enrollment = await Enrollment.findOne({ student: req.user._id, course: module.course });
  if (!enrollment) {
    return res.status(403).json({ message: "You are not enrolled in this course." });
  }

  if (!enrollment.completedModules.some((m) => String(m) === String(module._id))) {
    enrollment.completedModules.push(module._id);
    await enrollment.save();
  }

  await recalcProgress(enrollment);
  res.json({ enrollment });
});
