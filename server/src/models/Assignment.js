import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    instructions: { type: String, default: "" },
    deadline: { type: Date, required: true },
    maximumMarks: { type: Number, required: true, default: 100 },
  },
  { timestamps: true }
);

export default mongoose.model("Assignment", assignmentSchema);
