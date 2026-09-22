import Module from "../models/Module.js";

// Recalculates and persists an enrollment's progress % based on completed modules,
// and flips status to "completed" once all modules are done.
export const recalcProgress = async (enrollment) => {
  const totalModules = await Module.countDocuments({ course: enrollment.course });

  if (totalModules === 0) {
    enrollment.progress = 0;
  } else {
    const completed = enrollment.completedModules.length;
    enrollment.progress = Math.round((completed / totalModules) * 100);
  }

  enrollment.status = enrollment.progress >= 100 ? "completed" : "active";
  await enrollment.save();
  return enrollment;
};
