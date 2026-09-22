import mongoose from "mongoose";

const moduleSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    notes: { type: String, default: "" },
    resourceLinks: [{ type: String }], // PDFs, videos, references, source code
    moduleOrder: { type: Number, required: true },
  },
  { timestamps: true }
);

moduleSchema.index({ course: 1, moduleOrder: 1 });

export default mongoose.model("Module", moduleSchema);
