import crypto from "crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import { signToken, sendTokenCookie } from "../utils/generateToken.js";
import sendEmail from "../utils/sendEmail.js";
import { createNotification } from "./notificationController.js";

// Shape of the user object the client receives after any auth action
export const publicUser = (user, hasPassword) => ({
  _id: user._id,
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isSuperAdmin: !!user.isSuperAdmin,
  avatar: user.avatar,
  bio: user.bio,
  department: user.department,
  authProvider: user.authProvider,
  notificationPreferences: user.notificationPreferences,
  createdAt: user.createdAt,
  lastLogin: user.lastLogin,
  hasPassword: hasPassword ?? !!user.password,
});

const notifyAdminsOfSignup = async (user, via) => {
  const admins = await User.find({ role: "admin", isSuperAdmin: true }).select("_id");
  await Promise.all(
    admins.map((admin) =>
      createNotification({
        user: admin._id,
        title: "New student registered",
        message: `${user.name} (${user.email}) signed up${via ? ` with ${via}` : ""}.`,
        link: "/admin/students",
        type: "student_registered",
      })
    )
  );
};

// @route POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, adminCode } = req.body;

  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ message: "Name, email and password are required." });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ message: "Please enter a valid email address." });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    return res.status(409).json({ message: "An account with this email already exists." });
  }

  // Instructor (admin) sign-up is only possible when ADMIN_SIGNUP_CODE is configured
  // on the server and the caller supplies it. There is no built-in fallback code.
  const signupCode = process.env.ADMIN_SIGNUP_CODE;
  let finalRole = "student";
  if (role === "admin") {
    if (!signupCode || adminCode !== signupCode) {
      return res.status(403).json({ message: "Invalid instructor access code." });
    }
    finalRole = "admin";
  }

  const user = await User.create({ name: name.trim(), email, password, role: finalRole });
  if (finalRole === "student") notifyAdminsOfSignup(user);

  const token = signToken(user._id);
  sendTokenCookie(res, token);
  res.status(201).json({ token, user: publicUser(user, true) });
});

// @route POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
  if (!user || !user.password || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: "Invalid email or password." });
  }
  if (user.isActive === false) {
    return res.status(403).json({ message: "Your account has been deactivated. Please contact an administrator." });
  }

  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

  const token = signToken(user._id);
  sendTokenCookie(res, token);
  res.json({ token, user: publicUser(user, true) });
});

// @route POST /api/auth/logout
export const logout = asyncHandler(async (req, res) => {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
  });
  res.json({ message: "Logged out successfully." });
});

// @route GET /api/auth/session — like /me, but returns { user: null } instead of 401 when signed out,
// so the app can check "am I logged in?" on every page load without an error in the console
export const getSession = asyncHandler(async (req, res) => {
  if (!req.user) return res.json({ user: null });
  const fresh = await User.findById(req.user._id).select("+password");
  res.json({ user: publicUser(fresh, !!fresh.password) });
});

// @route GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  const fresh = await User.findById(req.user._id).select("+password");
  res.json({ user: publicUser(fresh, !!fresh.password) });
});

const clientUrl = () => (process.env.CLIENT_URL || "http://localhost:5174").replace(/\/$/, "");

// @route POST /api/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const genericResponse = { message: "If an account exists for that email, a reset link has been sent." };
  if (!email) return res.status(400).json({ message: "Email is required." });

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
  // Same response whether or not the account exists, to avoid leaking which emails are registered
  if (!user || !user.password) return res.json(genericResponse);

  const rawToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Always build the link from the server's configured CLIENT_URL, never from request headers
  const resetUrl = `${clientUrl()}/reset-password/${rawToken}`;

  const emailHtml = `
  <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1f2328">
    <p style="font-size:15px;font-weight:600;margin:0 0 16px">Ridgeline</p>
    <p>Hi ${String(user.name).replace(/[<>&"]/g, "")},</p>
    <p>We received a request to reset your password. The link below is valid for 30 minutes.</p>
    <p style="margin:24px 0">
      <a href="${resetUrl}" style="background:#0f6e56;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600">Reset password</a>
    </p>
    <p style="font-size:13px;color:#59636e">Or paste this link into your browser:<br>${resetUrl}</p>
    <p style="font-size:13px;color:#59636e">If you didn't ask for this, you can ignore this email.</p>
  </div>`;

  await sendEmail({
    to: user.email,
    subject: "Reset your Ridgeline password",
    html: emailHtml,
    text: `Hi ${user.name},\n\nReset your password (valid for 30 minutes):\n${resetUrl}\n\nIf you didn't ask for this, ignore this email.`,
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

// Firebase ID tokens are signed by Google. We verify the signature, issuer and audience
// so the email we trust really comes from a Google sign-in for our Firebase project.
const firebaseJwks = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

const verifyFirebaseIdToken = async (idToken) => {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  if (!projectId) {
    const err = new Error("Google sign-in is not configured on the server (FIREBASE_PROJECT_ID missing).");
    err.statusCode = 503;
    throw err;
  }
  const { payload } = await jwtVerify(idToken, firebaseJwks, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });
  if (!payload.email || payload.email_verified === false) {
    const err = new Error("Your Google account email is not verified.");
    err.statusCode = 401;
    throw err;
  }
  return payload;
};

// @route POST /api/auth/google
export const googleAuth = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ message: "Missing Google ID token." });
  }

  let payload;
  try {
    payload = await verifyFirebaseIdToken(idToken);
  } catch (err) {
    return res
      .status(err.statusCode || 401)
      .json({ message: err.statusCode ? err.message : "Google sign-in could not be verified. Please try again." });
  }

  const email = String(payload.email).toLowerCase();
  const googleId = payload.sub;
  const name = payload.name || email.split("@")[0];
  const avatar = payload.picture || "";

  let user = await User.findOne({ $or: [{ googleId }, { email }] }).select("+password");

  if (user) {
    if (user.isActive === false) {
      return res.status(403).json({ message: "Your account has been deactivated. Please contact an administrator." });
    }
    if (!user.googleId) user.googleId = googleId;
    if (!user.avatar && avatar) user.avatar = avatar;
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });
  } else {
    user = await User.create({
      name,
      email,
      avatar,
      googleId,
      authProvider: "google",
      role: "student",
      lastLogin: new Date(),
    });
    notifyAdminsOfSignup(user, "Google");
  }

  const token = signToken(user._id);
  sendTokenCookie(res, token);
  res.json({ token, user: publicUser(user, !!user.password) });
});
