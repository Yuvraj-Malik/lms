import crypto from "crypto";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import { signToken, sendTokenCookie } from "../utils/generateToken.js";
import sendEmail from "../utils/sendEmail.js";

// @route POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email and password are required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: "An account with this email already exists." });
  }

  // Only allow "admin" role via explicit signup code, otherwise force student.
  const finalRole =
    role === "admin" && req.body.adminCode && req.body.adminCode === (process.env.ADMIN_SIGNUP_CODE || "LMS-ADMIN-2026")
      ? "admin"
      : "student";

  const user = await User.create({ name, email, password, role: finalRole });

  const token = signToken(user._id);
  sendTokenCookie(res, token);

  res.status(201).json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

// @route POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const token = signToken(user._id);
  sendTokenCookie(res, token);

  res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
  });
});

// @route POST /api/auth/logout
export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully." });
});

// @route GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

// @route POST /api/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() });

  // Always respond the same way, whether or not the user exists (avoid email enumeration)
  const genericResponse = { message: "If an account exists for that email, a reset link has been sent." };

  if (!user) return res.json(genericResponse);

  const rawToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const clientOrigin = req.headers.origin || process.env.CLIENT_URL || "http://localhost:5173";
  const resetUrl = `${clientOrigin}/reset-password/${rawToken}`;

  const emailHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 24px;">
    <div style="max-width: 540px; margin: 0 auto; background: #1e293b; border-radius: 12px; border: 1px solid #334155; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #059669, #0d9488); padding: 32px 24px; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.02em;">TaskPulse LMS</h1>
      </div>
      <div style="padding: 32px 24px; color: #cbd5e1; font-size: 15px; line-height: 1.6;">
        <p style="margin-top: 0;">Hi <strong>${user.name}</strong>,</p>
        <p>You requested a password reset for your account. Click the button below to set a new password. This link will expire in <strong>30 minutes</strong>.</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${resetUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; font-weight: 600; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-size: 15px;" target="_blank">Reset Password</a>
        </div>
        <p style="font-size: 13px; color: #94a3b8;">If the button doesn't work, copy and paste this URL into your browser:</p>
        <p style="word-break: break-all; font-size: 13px;"><a href="${resetUrl}" style="color: #38bdf8;">${resetUrl}</a></p>
        <p style="font-size: 13px; color: #94a3b8; margin-top: 24px; border-top: 1px solid #334155; padding-top: 16px;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
      </div>
      <div style="padding: 16px 24px; background: #0f172a; font-size: 12px; color: #64748b; text-align: center;">
        &copy; ${new Date().getFullYear()} TaskPulse LMS. All rights reserved.
      </div>
    </div>
  </body>
  </html>
  `;

  await sendEmail({
    to: user.email,
    subject: "Reset your TaskPulse LMS password",
    html: emailHtml,
    text: `Hi ${user.name},\n\nPlease use the following link to reset your password (valid for 30 minutes):\n${resetUrl}\n\nIf you did not request this, please ignore this email.`,
  });

  res.json(genericResponse);
});

// @route POST /api/auth/reset-password/:token
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  }).select("+resetPasswordToken +resetPasswordExpires");

  if (!user) {
    return res.status(400).json({ message: "Reset link is invalid or has expired." });
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ message: "Password reset successful. You can now log in." });
});

// @route POST /api/auth/google
export const googleAuth = asyncHandler(async (req, res) => {
  const { email, name, avatar, googleId } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required for Google authentication." });
  }

  const cleanEmail = email.toLowerCase().trim();

  // Find user by googleId or email
  let user = await User.findOne({
    $or: [{ googleId: googleId || "__no_gid__" }, { email: cleanEmail }],
  });

  if (user) {
    // If user already exists, link Google ID and update avatar if not present
    let modified = false;
    if (googleId && !user.googleId) {
      user.googleId = googleId;
      modified = true;
    }
    if (avatar && !user.avatar) {
      user.avatar = avatar;
      modified = true;
    }
    if (modified) {
      await user.save({ validateBeforeSave: false });
    }
  } else {
    // Create new user authenticated via Google
    user = await User.create({
      name: name || cleanEmail.split("@")[0],
      email: cleanEmail,
      avatar: avatar || "",
      googleId: googleId || "",
      authProvider: "google",
      role: "student",
    });
  }

  const token = signToken(user._id);
  sendTokenCookie(res, token);

  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
  });
});

