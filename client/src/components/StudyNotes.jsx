import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

// Private notes per student per course. Stored in this browser only.
export default function StudyNotes({ courseId }) {
  const { user } = useAuth();
  const key = `ridgeline:notes:${user._id}:${courseId}`;
  const [text, setText] = useState(() => {
    try {
      return localStorage.getItem(key) || "";
    } catch {
      return "";
    }
  });
  const [saved, setSaved] = useState(true);
  const timer = useRef(null);

  useEffect(() => {
    setSaved(false);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        localStorage.setItem(key, text);
      } catch {
        /* storage full or blocked */
      }
      setSaved(true);
    }, 500);
    return () => clearTimeout(timer.current);
  }, [text, key]);

  return (
    <div className="rounded-lg border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5 text-[13px]">
        <span className="text-fg-muted">Only you can see these notes. They're saved in this browser.</span>
        <span className="text-fg-subtle">{saved ? "Saved" : "Saving…"}</span>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write down questions, summaries or anything you want to remember…"
        className="min-h-[420px] w-full resize-y bg-transparent px-4 py-3 font-mono text-[13px] leading-relaxed text-fg outline-none placeholder:text-fg-subtle"
      />
    </div>
  );
}
