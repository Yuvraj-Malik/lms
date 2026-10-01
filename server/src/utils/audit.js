import AuditLog from "../models/AuditLog.js";

// Records an admin action. Never throws: logging must not break the action itself.
export const audit = (req, action, summary, { targetType = "", targetId = null, link = "" } = {}) => {
  if (!req.user) return;
  AuditLog.create({
    actor: req.user._id,
    actorName: req.user.name,
    action,
    summary,
    targetType,
    targetId,
    link,
  }).catch((err) => console.error("Audit log failed:", err.message));
};
