import express from "express";
import { getStudentDashboard } from "../controllers/dashboardController.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();
router.get("/student", protect, requireRole("student"), getStudentDashboard);

export default router;
