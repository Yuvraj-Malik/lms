import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true, trim: true },
  options: {
    type: [{ type: String, trim: true }],
    validate: {
      validator: (arr) => Array.isArray(arr) && arr.length >= 2 && arr.every((o) => o && o.length),
      message: "Each quiz question needs at least two non-empty options.",
    },
  },
  answer: { type: Number, required: true, min: 0 },
  explanation: { type: String, default: "" },
});

questionSchema.pre("validate", function () {
  if (this.answer >= (this.options?.length || 0)) {
    this.invalidate("answer", "The correct answer must point to one of the options.");
  }
});

const moduleSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    notes: { type: String, default: "" },
    resourceLinks: [{ type: String, trim: true }], // PDFs, videos, references, source code
    moduleOrder: { type: Number, required: true },
    quiz: [questionSchema],
    // Percentage a student must score on the quiz before the module can be completed
    quizPassPercent: { type: Number, default: 60, min: 0, max: 100 },
  },
  { timestamps: true }
);

moduleSchema.index({ course: 1, moduleOrder: 1 });

export default mongoose.model("Module", moduleSchema);
