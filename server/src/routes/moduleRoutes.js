import express from "express";
import {
  getModulesForCourse,
  createModule,
  updateModule,
  reorderModules,
  deleteModule,
  markModuleComplete,
  submitQuiz,
} from "../controllers/moduleController.js";
import { protect, requireRole } from "../middleware/auth.js";

// /api/courses/:courseId/modules
export const courseModuleRouter = express.Router({ mergeParams: true });
courseModuleRouter.get("/", protect, getModulesForCourse);
courseModuleRouter.post("/", protect, requireRole("admin"), createModule);
courseModuleRouter.put("/reorder", protect, requireRole("admin"), reorderModules);

// /api/modules/:id
export const moduleRouter = express.Router();
moduleRouter.put("/:id", protect, requireRole("admin"), updateModule);
moduleRouter.delete("/:id", protect, requireRole("admin"), deleteModule);
moduleRouter.post("/:id/complete", protect, requireRole("student"), markModuleComplete);
moduleRouter.post("/:id/quiz", protect, requireRole("student"), submitQuiz);
