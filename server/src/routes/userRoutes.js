import express from "express";
import { updateProfile, changePassword } from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";
import { uploadAvatar } from "../middleware/upload.js";

const router = express.Router();
router.put("/profile", protect, uploadAvatar.single("avatar"), updateProfile);
router.put("/change-password", protect, changePassword);

export default router;
