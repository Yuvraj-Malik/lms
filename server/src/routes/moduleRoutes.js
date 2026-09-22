import express from "express";
import {
  getModulesForCourse,
  createModule,
  updateModule,
  deleteModule,
  markModuleComplete,
} from "../controllers/moduleController.js";
import { protect, requireRole } from "../middleware/auth.js";

// courseModuleRouter handles /api/courses/:courseId/modules
export const courseModuleRouter = express.Router({ mergeParams: true });
courseModuleRouter.get("/", getModulesForCourse);
courseModuleRouter.post("/", protect, requireRole("admin"), createModule);

// moduleRouter handles /api/modules/:id
export const moduleRouter = express.Router();
moduleRouter.put("/:id", protect, requireRole("admin"), updateModule);
moduleRouter.delete("/:id", protect, requireRole("admin"), deleteModule);
moduleRouter.post("/:id/complete", protect, requireRole("student"), markModuleComplete);
