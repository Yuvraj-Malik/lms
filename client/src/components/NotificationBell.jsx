import React, { useState, useEffect, useRef } from "react";
import { Bell, Info, AlertCircle, Award, BookOpen, CheckCheck, Trash2, X, User as UserIcon, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { notificationApi } from "../api/endpoints.js";
import { Button } from "./ui.jsx";

function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDays = Math.floor(diffHour / 24);
  return `${diffDays}d ago`;
}

const TYPE_LABELS = {
  assignment_new: "New Assignment",
  deadline_approaching: "Deadline Approaching",
  submission_graded: "Submission Graded",
  module_completed: "Module Completed",
  course_completed: "Course Completed",
  student_registered: "New Student Registered",
  submission_received: "Submission Received",
  admin_announcement: "Announcement",
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [detail, setDetail] = useState(null); // selected notification for detail view
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await notificationApi.list();
      const list = res.data.notifications || [];
      setNotifications(list);
      setUnreadCount(res.data.unreadCount || list.filter((n) => !n.isRead).length);
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Clear all notifications? This cannot be undone.")) return;
    try {
      await notificationApi.clearAll();
      setNotifications([]);
      setUnreadCount(0);
      setIsOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClickItem = async (notification) => {
    if (!notification.isRead) {
      try {
        await notificationApi.markRead(notification._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (err) {
        console.error(err);
      }
    }
    setDetail({ ...notification, isRead: true });
  };

  const handleGoToLink = () => {
    if (detail?.link) {
      setDetail(null);
      setIsOpen(false);
      navigate(detail.link);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "submission_graded":
        return <Award size={16} className="text-amber" />;
      case "assignment_new":
        return <BookOpen size={16} className="text-pine" />;
      case "deadline_approaching":
        return <AlertCircle size={16} className="text-clay" />;
      case "module_completed":
      case "course_completed":
        return <Award size={16} className="text-pine-light" />;
      default:
        return <Info size={16} className="text-ink-soft dark:text-dark-ink-soft" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        aria-label="View notifications"
        className="relative rounded-full p-2 text-ink-soft transition-colors hover:bg-surface-sunken hover:text-ink dark:text-dark-ink-soft dark:hover:bg-dark-surface-sunken dark:hover:text-dark-ink"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-clay px-1 text-[10px] font-bold text-white shadow-sm animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-border bg-surface shadow-xl z-50 overflow-hidden dark:border-dark-border dark:bg-dark-surface">
          <div className="flex items-center justify-between border-b border-border px-4 py-3 dark:border-dark-border">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-sm font-semibold text-ink dark:text-dark-ink">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-surface-sunken px-2 py-0.5 text-xs font-medium text-ink-soft dark:bg-dark-surface-sunken dark:text-dark-ink-soft">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-xs font-medium text-pine hover:underline dark:text-amber-light"
                >
                  <CheckCheck size={12} /> Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-1 text-xs font-medium text-ink-soft hover:text-clay dark:text-dark-ink-soft"
                >
                  <Trash2 size={12} /> Clear all
                </button>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-border/50 dark:divide-dark-border/50">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-ink-soft dark:text-dark-ink-soft">
                No notifications yet. You're all caught up!
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleClickItem(n)}
                  className={`flex cursor-pointer items-start gap-3 p-3.5 transition-colors hover:bg-surface-sunken dark:hover:bg-dark-surface-sunken ${
                    !n.isRead
                      ? "bg-amber/5 dark:bg-amber-light/5"
                      : "opacity-80 hover:opacity-100"
                  }`}
                >
                  <div className="flex-shrink-0">{getTypeIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={`text-xs font-semibold truncate ${!n.isRead ? "text-ink dark:text-dark-ink" : "text-ink-soft dark:text-dark-ink-soft"}`}>
                        {n.title}
                      </p>
                      <span className="whitespace-nowrap text-[10px] text-ink-soft dark:text-dark-ink-soft flex-shrink-0">
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-soft dark:text-dark-ink-soft line-clamp-2">
                      {n.message}
                    </p>
                  </div>
                  {!n.isRead && (
                    <span className="mt-1 h-2 w-2 rounded-full bg-clay flex-shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Notification detail modal */}
      {detail && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setDetail(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-2xl dark:border-dark-border dark:bg-dark-surface"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-surface-sunken dark:bg-dark-surface-sunken">
                  {getTypeIcon(detail.type)}
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-soft dark:text-dark-ink-soft">
                    {TYPE_LABELS[detail.type] || "Notification"}
                  </p>
                  <h3 className="font-display text-sm font-bold text-ink dark:text-dark-ink">{detail.title}</h3>
                </div>
              </div>
              <button
                onClick={() => setDetail(null)}
                className="rounded-full p-1 text-ink-soft hover:bg-surface-sunken hover:text-ink dark:text-dark-ink-soft dark:hover:bg-dark-surface-sunken"
              >
                <X size={16} />
              </button>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-ink dark:text-dark-ink">{detail.message}</p>

            <div className="mt-4 space-y-1.5 border-t border-border/60 pt-3 text-xs text-ink-soft dark:border-dark-border/60 dark:text-dark-ink-soft">
              <p className="flex items-center gap-1.5">
                <UserIcon size={12} />
                Sent by {detail.sentBy?.name ? `${detail.sentBy.name}${detail.sentBy.role === "admin" ? " (Admin)" : ""}` : "System"}
              </p>
              <p>{new Date(detail.createdAt).toLocaleString()}</p>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button size="sm" tone="secondary" onClick={() => setDetail(null)}>
                Close
              </Button>
              {detail.link && (
                <Button size="sm" tone="pine" onClick={handleGoToLink} className="gap-1">
                  <ExternalLink size={13} /> Open
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
