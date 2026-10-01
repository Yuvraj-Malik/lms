import Module from "../models/Module.js";
import Enrollment from "../models/Enrollment.js";

// Recalculates and persists an enrollment's progress % based on completed modules
// that still exist, and flips status to "completed" once all modules are done.
export const recalcProgress = async (enrollment) => {
  const modules = await Module.find({ course: enrollment.course }).select("_id");
  const valid = new Set(modules.map((m) => String(m._id)));

  enrollment.completedModules = enrollment.completedModules.filter((m) => valid.has(String(m)));
  const total = modules.length;
  enrollment.progress = total === 0 ? 0 : Math.round((enrollment.completedModules.length / total) * 100);

  const wasCompleted = enrollment.status === "completed";
  enrollment.status = total > 0 && enrollment.progress >= 100 ? "completed" : "active";
  if (enrollment.status === "completed" && !wasCompleted) enrollment.completedAt = new Date();
  if (enrollment.status !== "completed") enrollment.completedAt = null;

  await enrollment.save();
  return enrollment;
};

// Used whenever modules are added/removed so every student's % stays correct
export const recalcCourseProgress = async (courseId) => {
  const enrollments = await Enrollment.find({ course: courseId });
  for (const e of enrollments) await recalcProgress(e);
};
