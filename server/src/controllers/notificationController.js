import Notification from "../models/Notification.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * Utility helper to dispatch an in-app notification.
 */
export const createNotification = async ({ user, title, message, link, type }) => {
  try {
    return await Notification.create({ user, title, message, link, type });
  } catch (err) {
    console.error("Failed to create notification:", err.message);
    return null;
  }
};

// @route GET /api/notifications
export const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
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
