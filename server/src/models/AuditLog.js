import mongoose from "mongoose";

// Who did what. Written by admin actions; read by the super admin's Activity log.
const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    actorName: { type: String, default: "" },
    action: { type: String, required: true }, // e.g. "course.update"
    summary: { type: String, required: true },
    targetType: { type: String, default: "" },
    targetId: { type: mongoose.Schema.Types.ObjectId, default: null },
    link: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

export default mongoose.model("AuditLog", auditLogSchema);
