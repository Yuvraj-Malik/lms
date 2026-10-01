import Discussion from "../models/Discussion.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ownsCourse, HttpError } from "../utils/access.js";

const CATEGORIES = ["General", "Module Question", "Assignment Help", "Bug/Issue"];
const POPULATE = [
  { path: "user", select: "name role avatar isSuperAdmin" },
  { path: "replies.user", select: "name role avatar isSuperAdmin" },
];

// Discussions are visible to enrolled students and to whoever manages the course
const assertAccess = async (user, courseId) => {
  const course = await Course.findById(courseId);
  if (!course) throw new HttpError(404, "Course not found.");
  if (ownsCourse(user, course)) return { course, manager: true };
  if (await Enrollment.exists({ course: course._id, student: user._id })) return { course, manager: false };
  throw new HttpError(403, "Enroll in this course to join its discussion.");
};

// @route GET /api/discussions/course/:courseId
export const getCourseDiscussions = asyncHandler(async (req, res) => {
  const { manager } = await assertAccess(req.user, req.params.courseId);
  const discussions = await Discussion.find({ course: req.params.courseId }).populate(POPULATE).sort({ createdAt: -1 });
  res.json({ discussions, canModerate: manager });
});

// @route POST /api/discussions/course/:courseId
export const createDiscussion = asyncHandler(async (req, res) => {
  await assertAccess(req.user, req.params.courseId);
  const { title, content, category } = req.body;
  if (!title?.trim() || !content?.trim()) {
    return res.status(400).json({ message: "Add a title and some details." });
  }
  const discussion = await Discussion.create({
    course: req.params.courseId,
    user: req.user._id,
    title: title.trim(),
    content: content.trim(),
    category: CATEGORIES.includes(category) ? category : "General",
  });
  await discussion.populate(POPULATE);
  res.status(201).json({ discussion });
});

const loadThread = async (user, id) => {
  const discussion = await Discussion.findById(id);
  if (!discussion) throw new HttpError(404, "Discussion not found.");
  const access = await assertAccess(user, discussion.course);
  return { discussion, ...access };
};

// @route POST /api/discussions/:discussionId/reply
export const addReply = asyncHandler(async (req, res) => {
  const { discussion, manager } = await loadThread(req.user, req.params.discussionId);
  if (!req.body.content?.trim()) return res.status(400).json({ message: "Reply can't be empty." });

  discussion.replies.push({
    user: req.user._id,
    content: req.body.content.trim(),
    isInstructorAnswer: manager,
    createdAt: new Date(),
  });
  await discussion.save();
  await discussion.populate(POPULATE);
  res.status(201).json({ discussion });
});

// @route POST /api/discussions/:discussionId/upvote
export const toggleUpvote = asyncHandler(async (req, res) => {
  const { discussion } = await loadThread(req.user, req.params.discussionId);
  const uid = String(req.user._id);
  const has = discussion.upvotes.some((u) => String(u) === uid);
  discussion.upvotes = has ? discussion.upvotes.filter((u) => String(u) !== uid) : [...discussion.upvotes, req.user._id];
  await discussion.save();
  await discussion.populate(POPULATE);
  res.json({ discussion });
});

// @route DELETE /api/discussions/:discussionId  (author or course manager)
export const deleteDiscussion = asyncHandler(async (req, res) => {
  const { discussion, manager } = await loadThread(req.user, req.params.discussionId);
  if (!manager && String(discussion.user) !== String(req.user._id)) {
    return res.status(403).json({ message: "You can only delete your own threads." });
  }
  await discussion.deleteOne();
  res.json({ message: "Thread deleted." });
});

// @route DELETE /api/discussions/:discussionId/replies/:replyId  (author or course manager)
export const deleteReply = asyncHandler(async (req, res) => {
  const { discussion, manager } = await loadThread(req.user, req.params.discussionId);
  const reply = discussion.replies.id(req.params.replyId);
  if (!reply) return res.status(404).json({ message: "Reply not found." });
  if (!manager && String(reply.user) !== String(req.user._id)) {
    return res.status(403).json({ message: "You can only delete your own replies." });
  }
  reply.deleteOne();
  await discussion.save();
  await discussion.populate(POPULATE);
  res.json({ discussion });
});
