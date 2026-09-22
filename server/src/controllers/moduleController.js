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
  if (!title?.trim()) return res.status(400).json({ message: "Module title is required." });

  if (moduleOrder !== undefined && (isNaN(moduleOrder) || Number(moduleOrder) < 1)) {
    return res.status(400).json({ message: "Module order must be a positive integer." });
  }

  const count = await Module.countDocuments({ course: req.params.courseId });

  const module = await Module.create({
    course: req.params.courseId,
    title: title.trim(),
    description: description || "",
    notes: notes || "",
    resourceLinks: Array.isArray(resourceLinks) ? resourceLinks : resourceLinks ? [resourceLinks] : [],
    moduleOrder: moduleOrder ? Number(moduleOrder) : count + 1,
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

import Course from "../models/Course.js";
import { createNotification } from "./notificationController.js";

// @route POST /api/modules/:id/complete  (student marks module complete)
export const markModuleComplete = asyncHandler(async (req, res) => {
  const module = await Module.findById(req.params.id);
  if (!module) return res.status(404).json({ message: "Module not found." });

  const enrollment = await Enrollment.findOne({ student: req.user._id, course: module.course });
  if (!enrollment) {
    return res.status(403).json({ message: "You are not enrolled in this course." });
  }

  const isNewlyCompleted = !enrollment.completedModules.some((m) => String(m) === String(module._id));
  if (isNewlyCompleted) {
    enrollment.completedModules.push(module._id);
    await enrollment.save();
  }

  await recalcProgress(enrollment);

  if (isNewlyCompleted) {
    const course = await Course.findById(module.course);
    if (enrollment.progress >= 100) {
      createNotification({
        user: req.user._id,
        title: "Course Completed! 🎉",
        message: `Congratulations! You have completed all modules in "${course?.title || "your course"}". Your completion certificate is ready on your Profile.`,
        link: "/dashboard/profile",
        type: "course_completed",
      });
    } else {
      createNotification({
        user: req.user._id,
        title: "Module Completed",
        message: `You completed "${module.title}". Current progress: ${enrollment.progress}%.`,
        link: `/dashboard/my-courses/${module.course}`,
        type: "module_completed",
      });
    }
  }

  res.json({ enrollment, message: "Module marked as completed." });
});
