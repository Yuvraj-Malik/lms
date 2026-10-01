import mongoose from "mongoose";

const quizAttemptSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    module: { type: mongoose.Schema.Types.ObjectId, ref: "Module", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    answers: [{ type: Number }],
    score: { type: Number, required: true },
    total: { type: Number, required: true },
    passed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

quizAttemptSchema.index({ student: 1, module: 1, createdAt: -1 });

export default mongoose.model("QuizAttempt", quizAttemptSchema);
