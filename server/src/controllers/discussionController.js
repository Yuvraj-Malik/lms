import Discussion from "../models/Discussion.js";
import Course from "../models/Course.js";
import asyncHandler from "../utils/asyncHandler.js";

// @route GET /api/discussions/course/:courseId
export const getCourseDiscussions = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const discussions = await Discussion.find({ course: courseId })
    .populate("user", "name email role avatar")
    .populate("replies.user", "name email role avatar")
    .sort({ createdAt: -1 });

  res.json({ discussions });
});

// @route POST /api/discussions/course/:courseId
export const createDiscussion = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { title, content, category } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: "Title and content are required." });
  }

  const course = await Course.findById(courseId);
  if (!course) {
    return res.status(404).json({ message: "Course not found." });
  }

  const discussion = await Discussion.create({
    course: courseId,
    user: req.user._id,
    title,
    content,
    category: category || "General",
  });

  const populated = await Discussion.findById(discussion._id).populate(
    "user",
    "name email role avatar"
  );

  res.status(201).json({ discussion: populated });
});

// @route POST /api/discussions/:discussionId/reply
export const addReply = asyncHandler(async (req, res) => {
  const { discussionId } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ message: "Reply content cannot be empty." });
  }

  const discussion = await Discussion.findById(discussionId);
  if (!discussion) {
    return res.status(404).json({ message: "Discussion thread not found." });
  }

  const isInstructorAnswer = req.user.role === "admin";

  discussion.replies.push({
    user: req.user._id,
    content,
    isInstructorAnswer,
    createdAt: new Date(),
  });

  await discussion.save();

  const updated = await Discussion.findById(discussionId)
    .populate("user", "name email role avatar")
    .populate("replies.user", "name email role avatar");

  res.status(201).json({ discussion: updated });
});

// @route POST /api/discussions/:discussionId/upvote
export const toggleUpvote = asyncHandler(async (req, res) => {
  const { discussionId } = req.params;
  const userId = req.user._id;

  const discussion = await Discussion.findById(discussionId);
  if (!discussion) {
    return res.status(404).json({ message: "Discussion thread not found." });
  }

  const index = discussion.upvotes.indexOf(userId);
  if (index > -1) {
    discussion.upvotes.splice(index, 1);
  } else {
    discussion.upvotes.push(userId);
  }

  await discussion.save();

  const updated = await Discussion.findById(discussionId)
    .populate("user", "name email role avatar")
    .populate("replies.user", "name email role avatar");

  res.json({ discussion: updated });
});
