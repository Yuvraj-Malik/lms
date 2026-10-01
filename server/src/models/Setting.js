import mongoose from "mongoose";

// Single document (key: "platform") holding switches the super admin controls from the UI
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "platform" },
    platformName: { type: String, default: "Ridgeline", trim: true, maxlength: 60 },
    registrationOpen: { type: Boolean, default: true },
    googleSignInEnabled: { type: Boolean, default: true },
    instructorSignupEnabled: { type: Boolean, default: false },
    instructorSignupCode: { type: String, default: "", trim: true },
    instructorsCanPublish: { type: Boolean, default: true },
    defaultQuizPassPercent: { type: Number, default: 60, min: 0, max: 100 },
    allowLateSubmissions: { type: Boolean, default: true },
    banner: {
      active: { type: Boolean, default: false },
      message: { type: String, default: "", maxlength: 280 },
      tone: { type: String, enum: ["info", "warn", "danger", "ok"], default: "info" },
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Setting", settingSchema);
