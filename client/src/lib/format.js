const DAY = 86400000;

export const fmtDate = (d, opts = {}) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", ...opts }) : "—";

export const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })
    : "—";

export const timeAgo = (d) => {
  if (!d) return "";
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return fmtDate(d);
};

// Whole calendar days from today until the date (negative when in the past)
export const daysUntil = (d) => {
  const a = new Date(d);
  a.setHours(0, 0, 0, 0);
  const b = new Date();
  b.setHours(0, 0, 0, 0);
  return Math.round((a - b) / DAY);
};

export const dueLabel = (deadline) => {
  const n = daysUntil(deadline);
  if (n < -1) return `${-n} days overdue`;
  if (n === -1) return "Due yesterday";
  if (n === 0) return "Due today";
  if (n === 1) return "Due tomorrow";
  if (n < 7) return `Due in ${n} days`;
  return `Due ${fmtDate(deadline, { year: undefined })}`;
};

export const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase() || "?";

export const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);

export const plural = (n, word, many = `${word}s`) => `${n} ${n === 1 ? word : many}`;

// Turns "2026-10-01T18:30:00.000Z" into the value a <input type="datetime-local"> expects
export const toLocalInput = (d) => {
  if (!d) return "";
  const date = new Date(d);
  const off = date.getTimezoneOffset();
  return new Date(date.getTime() - off * 60000).toISOString().slice(0, 16);
};

// Assignment state from the student's point of view
export const assignmentState = (assignment, submission) => {
  if (submission?.status === "graded") return "graded";
  if (submission) return submission.status === "late" ? "late" : "submitted";
  return new Date(assignment.deadline) < new Date() ? "overdue" : "todo";
};
