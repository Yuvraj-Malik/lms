import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    link: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "assignment_new",
        "deadline_approaching",
        "submission_graded",
        "module_completed",
        "course_completed",
        "student_registered",
        "submission_received",
      ],
      default: "assignment_new",
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
