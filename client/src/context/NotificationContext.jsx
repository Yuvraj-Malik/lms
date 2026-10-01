import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { notificationApi } from "../api/endpoints.js";
import { useAuth } from "./AuthContext.jsx";

const NotificationContext = createContext(null);

const POLL_INTERVAL_ACTIVE = 2000; // 2 seconds active polling
const POLL_INTERVAL_BG = 10000;    // 10 seconds background tab polling

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const fetchingRef = useRef(false);

  const load = useCallback(async () => {
    if (!user?._id || fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const { data } = await notificationApi.list();
      setItems(data.notifications || []);
      setUnread(data.unreadCount || 0);
    } catch {
      /* the bell stays quiet if the request fails */
    } finally {
      fetchingRef.current = false;
    }
  }, [user?._id]);

  useEffect(() => {
    if (!user?._id) {
      setItems([]);
      setUnread(0);
      return;
    }

    // Initial fetch immediately on login / mount
    load();

    let timer = null;

    const scheduleNext = (delay) => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        await load();
        const nextDelay = document.hidden ? POLL_INTERVAL_BG : POLL_INTERVAL_ACTIVE;
        scheduleNext(nextDelay);
      }, delay);
    };

    scheduleNext(POLL_INTERVAL_ACTIVE);

    // Refresh immediately when returning to tab or window gains focus
    const onVisibilityChange = () => {
      if (!document.hidden) {
        load();
        scheduleNext(POLL_INTERVAL_ACTIVE);
      }
    };
    const onFocus = () => {
      load();
      scheduleNext(POLL_INTERVAL_ACTIVE);
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onFocus);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onFocus);
    };
  }, [user?._id, load]);

  const openItem = useCallback(
    async (n, navigate) => {
      if (!n.isRead) {
        notificationApi.markRead(n._id).catch(() => {});
        setItems((list) => list.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)));
        setUnread((u) => Math.max(0, u - 1));
      }
      if (n.link && navigate) {
        navigate(n.link);
      }
    },
    []
  );

  const markAll = useCallback(async () => {
    await notificationApi.markAllRead().catch(() => {});
    setItems((list) => list.map((x) => ({ ...x, isRead: true })));
    setUnread(0);
  }, []);

  const clearAll = useCallback(async () => {
    await notificationApi.clearAll().catch(() => {});
    setItems([]);
    setUnread(0);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        items,
        unread,
        load,
        openItem,
        markAll,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
};
