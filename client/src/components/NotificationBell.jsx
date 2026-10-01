import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { notificationApi } from "../api/endpoints.js";
import { timeAgo } from "../lib/format.js";
import { cx } from "./ui.jsx";

import { useNotifications } from "../context/NotificationContext.jsx";

export default function NotificationBell({ placement = "down", align = "auto" }) {
  const { items, unread, load, openItem, markAll, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const [resolvedAlign, setResolvedAlign] = useState(align === "auto" ? "right" : align);
  const box = useRef(null);
  const navigate = useNavigate();

  const updateAlign = useCallback(() => {
    if (align !== "auto") {
      setResolvedAlign(align);
      return;
    }
    if (!box.current) return;
    const rect = box.current.getBoundingClientRect();
    const spaceOnRight = window.innerWidth - rect.left;
    const spaceOnLeft = rect.right;
    setResolvedAlign(spaceOnRight >= spaceOnLeft ? "left" : "right");
  }, [align]);

  useEffect(() => {
    if (open) {
      updateAlign();
      window.addEventListener("resize", updateAlign);
      return () => window.removeEventListener("resize", updateAlign);
    }
  }, [open, updateAlign]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => box.current && !box.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleOpenItem = (n) => {
    setOpen(false);
    openItem(n, navigate);
  };

  return (
    <div className="relative" ref={box}>
      <button
        type="button"
        onClick={() => {
          if (!open) {
            updateAlign();
            load();
          }
          setOpen((v) => !v);
        }}
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-md text-fg-muted hover:bg-subtle hover:text-fg"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="tabular absolute right-0.5 top-0.5 min-w-[15px] rounded-full bg-accent px-1 text-center text-[10px] font-semibold leading-[15px] text-white dark:text-[#0c1a15]">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className={cx(
            "animate-pop absolute z-50 w-[min(360px,calc(100vw-1.5rem))] overflow-hidden rounded-lg bg-surface shadow-pop",
            placement === "up"
              ? (resolvedAlign === "left" ? "bottom-full left-0 mb-2" : "bottom-full right-0 mb-2")
              : (resolvedAlign === "left" ? "left-0 top-full mt-2" : "right-0 top-full mt-2")
          )}
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <span className="text-sm font-semibold">Notifications</span>
            <div className="flex gap-3 text-[13px]">
              {unread > 0 && (
                <button onClick={markAll} className="text-fg-muted hover:text-fg">
                  Mark all read
                </button>
              )}
              {items.length > 0 && (
                <button onClick={clearAll} className="text-fg-muted hover:text-fg">
                  Clear
                </button>
              )}
            </div>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-10 text-center text-[13px] text-fg-muted">You're all caught up.</p>
            ) : (
              items.map((n) => (
                <button
                  key={n._id}
                  onClick={() => handleOpenItem(n)}
                  className="flex w-full gap-3 border-b border-line px-4 py-3 text-left last:border-0 hover:bg-subtle"
                >
                  <span className={cx("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", n.isRead ? "bg-transparent" : "bg-accent")} />
                  <span className="min-w-0 flex-1">
                    <span className={cx("block text-[13px]", n.isRead ? "text-fg-muted" : "font-medium text-fg")}>{n.title}</span>
                    <span className="mt-0.5 block text-[13px] leading-snug text-fg-muted">{n.message}</span>
                    <span className="mt-1 block text-xs text-fg-subtle">
                      {n.sentBy?.name ? `${n.sentBy.name} · ` : ""}
                      {timeAgo(n.createdAt)}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
