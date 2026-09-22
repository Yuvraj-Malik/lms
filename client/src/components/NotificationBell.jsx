import React, { useState, useEffect, useRef } from "react";
import { Bell, Check, Info, AlertCircle, Award, BookOpen } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { notificationApi } from "../api/endpoints.js";

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

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
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
    setIsOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "grade":
        return <Award size={16} className="text-amber" />;
      case "assignment":
        return <BookOpen size={16} className="text-pine" />;
      case "deadline":
        return <AlertCircle size={16} className="text-clay" />;
      case "course":
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
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-pine hover:underline dark:text-amber-light"
              >
                Mark all read
              </button>
            )}
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
                  <div className="mt-0.5 flex-shrink-0">{getTypeIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-xs font-semibold truncate ${!n.isRead ? "text-ink dark:text-dark-ink" : "text-ink-soft dark:text-dark-ink-soft"}`}>
                        {n.title}
                      </p>
                      <span className="text-[10px] text-ink-soft dark:text-dark-ink-soft flex-shrink-0">
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-soft dark:text-dark-ink-soft line-clamp-2">
                      {n.message}
                    </p>
                  </div>
                  {!n.isRead && (
                    <span className="h-2 w-2 rounded-full bg-clay flex-shrink-0 self-center" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
