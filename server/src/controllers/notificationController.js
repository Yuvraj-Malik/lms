import Notification from "../models/Notification.js";
import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/User.js";
import sendEmail from "../utils/sendEmail.js";

// Which notification types may also go out by email, and which preference controls them
const EMAIL_RULES = {
  assignment_new: "assignmentAlerts",
  submission_graded: "gradeAlerts",
  admin_announcement: null,
  course_completed: null,
};

const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const maybeEmail = async (userId, title, message, link, type) => {
  if (!(type in EMAIL_RULES)) return;
  const user = await User.findById(userId).select("email name notificationPreferences isActive");
  if (!user || user.isActive === false) return;
  const prefs = user.notificationPreferences || {};
  if (prefs.emailNotifications === false) return;
  const specific = EMAIL_RULES[type];
  if (specific && prefs[specific] === false) return;

  const base = (process.env.CLIENT_URL || "http://localhost:5174").split(",")[0].trim().replace(/\/$/, "");
  const url = link ? `${base}${link}` : base;
  await sendEmail({
    to: user.email,
    subject: title,
    text: `Hi ${user.name},\n\n${message}\n\nOpen Ridgeline: ${url}\n\nYou can turn these emails off in Account settings.`,
    html: `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;color:#1b1c1a"><p>Hi ${esc(user.name)},</p><p>${esc(message)}</p><p><a href="${url}" style="color:#0f6e56">Open Ridgeline</a></p><p style="font-size:12px;color:#8b8e86">You can turn these emails off in Account settings.</p></div>`,
  });
};

/**
 * Creates an in-app notification and, if the recipient allows it, emails it too.
 * Never throws: a failed notification must not break the action that caused it.
 */
export const createNotification = async ({ user, sentBy, title, message, link, type }) => {
  try {
    const n = await Notification.create({ user, sentBy: sentBy || null, title, message, link, type });
    maybeEmail(user, title, message, link, type).catch((err) => console.error("Notification email failed:", err.message));
    return n;
  } catch (err) {
    console.error("Failed to create notification:", err.message);
    return null;
  }
};

// @route GET /api/notifications
export const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .populate("sentBy", "name role avatar")
    .sort({ createdAt: -1 })
    .limit(30);

  const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });

  res.json({ notifications, unreadCount });
});

// @route PUT /api/notifications/:id/read
export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    return res.status(404).json({ message: "Notification not found." });
  }

  res.json({ notification });
});

// @route PUT /api/notifications/read-all
export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.json({ message: "All notifications marked as read." });
});

// @route DELETE /api/notifications/clear-all
export const clearAllNotifications = asyncHandler(async (req, res) => {
  await Notification.deleteMany({ user: req.user._id });
  res.json({ message: "All notifications cleared." });
});
