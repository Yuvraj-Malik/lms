import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";

// @route PUT /api/users/profile
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { name, bio } = req.body;

  if (name) user.name = name;
  if (bio !== undefined) user.bio = bio;
  if (req.file) user.avatar = `/uploads/avatars/${req.file.filename}`;

  await user.save();
  res.json({ user });
});

// @route PUT /api/users/change-password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: "Current password and a new password (6+ chars) are required." });
  }

  const user = await User.findById(req.user._id).select("+password");
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) return res.status(401).json({ message: "Current password is incorrect." });

  user.password = newPassword;
  await user.save();
  res.json({ message: "Password changed successfully." });
});
