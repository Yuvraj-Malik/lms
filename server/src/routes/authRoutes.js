import express from "express";
import {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  googleAuth,
  getSession,
} from "../controllers/authController.js";
import { protect, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protect, getMe);
router.get("/session", optionalAuth, getSession);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/google", googleAuth);

export default router;
