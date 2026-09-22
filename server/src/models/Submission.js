import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    submissionType: {
      type: String,
      enum: ["text", "github", "drive", "url", "file"],
      required: true,
    },
    textContent: { type: String, default: "" },
    submissionLink: { type: String, default: "" },
    filePath: { type: String, default: "" },
    fileOriginalName: { type: String, default: "" },
    submissionDate: { type: Date, default: Date.now },
    marks: { type: Number, default: null },
    feedback: { type: String, default: "" },
    status: {
      type: String,
      enum: ["submitted", "graded", "late"],
      default: "submitted",
    },
  },
  { timestamps: true }
);

// One submission per student per assignment (resubmission overwrites via upsert in controller)
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

export default mongoose.model("Submission", submissionSchema);
