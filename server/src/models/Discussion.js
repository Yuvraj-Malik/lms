import mongoose from "mongoose";

const replySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true, trim: true },
  isInstructorAnswer: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const discussionSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["General", "Module Question", "Assignment Help", "Bug/Issue"],
      default: "General",
    },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    replies: [replySchema],
  },
  { timestamps: true }
);

discussionSchema.index({ course: 1, createdAt: -1 });

export default mongoose.model("Discussion", discussionSchema);
