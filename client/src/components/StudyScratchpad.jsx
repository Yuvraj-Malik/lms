import React, { useState, useEffect } from "react";
import { 
  FileEdit, 
  Download, 
  Trash2, 
  Check, 
  BookOpen, 
  Sparkles 
} from "lucide-react";
import { Button } from "./ui.jsx";

export default function StudyScratchpad({ courseId, courseTitle, activeModuleTitle }) {
  const storageKey = `ridgeline_notes_${courseId}`;
  const [notes, setNotes] = useState(() => {
    try {
      return localStorage.getItem(storageKey) || "";
    } catch {
      return "";
    }
  });
  const [saveStatus, setSaveStatus] = useState("Saved");

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, notes);
      setSaveStatus("Saving…");
      const timer = setTimeout(() => setSaveStatus("Saved locally"), 400);
      return () => clearTimeout(timer);
    } catch (e) {
      console.error("Local storage error:", e);
    }
  }, [notes, storageKey]);

  const handleDownload = () => {
    if (!notes.trim()) {
      alert("Scratchpad is empty.");
      return;
    }
    const blob = new Blob([notes], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${courseTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-study-notes.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (window.confirm("Clear all personal study notes for this course? This cannot be undone.")) {
      setNotes("");
    }
  };

  const insertTimestamp = () => {
    const timestamp = `\n\n--- [Notes: ${activeModuleTitle || "General"} | ${new Date().toLocaleDateString()}] ---\n`;
    setNotes((prev) => prev + timestamp);
  };

  const wordCount = notes.trim() ? notes.trim().split(/\s+/).length : 0;

  return (
    <div className="rounded-[12px] border border-border-subtle bg-bg-surface p-6 shadow-card space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border-subtle pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-primary-600/10 text-primary-400">
            <FileEdit size={18} />
          </div>
          <div>
            <h3 className="type-h3 text-text-primary">
              Personal Study Scratchpad
            </h3>
            <p className="type-caption text-text-tertiary">
              Private auto-saving notes stored securely in your browser session
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="type-caption text-emerald-500 font-medium flex items-center gap-1 mr-2">
            <Check size={12} /> {saveStatus}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={insertTimestamp}
            className="text-xs"
          >
            Insert Section Tag
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleDownload}
            disabled={!notes.trim()}
            className="gap-1 text-xs"
          >
            <Download size={13} /> Export .txt
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClear}
            disabled={!notes.trim()}
            className="text-text-tertiary hover:text-semantic-danger"
          >
            <Trash2 size={13} />
          </Button>
        </div>
      </div>

      <div>
        <textarea
          rows={14}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={`Jot down lecture insights, questions to revisit, key formulas, or code snippets for ${courseTitle}…\n\nExample:\n• Key takeaway from Module 1\n• Question on promise rejection handling\n• Formula/API endpoint pattern`}
          className="w-full rounded-[8px] border border-border-subtle bg-bg-surface-raised p-4 font-mono text-sm leading-relaxed text-text-primary placeholder:text-text-tertiary focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all"
        />
      </div>

      <div className="flex items-center justify-between type-caption text-text-tertiary pt-1">
        <span>Course: {courseTitle}</span>
        <span>
          {wordCount} words · {notes.length} characters
        </span>
      </div>
    </div>
  );
}
