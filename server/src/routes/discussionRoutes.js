import express from "express";
import {
  getCourseDiscussions,
  createDiscussion,
  addReply,
  toggleUpvote,
  deleteDiscussion,
  deleteReply,
} from "../controllers/discussionController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

router.get("/course/:courseId", getCourseDiscussions);
router.post("/course/:courseId", createDiscussion);
router.post("/:discussionId/reply", addReply);
router.post("/:discussionId/upvote", toggleUpvote);
router.delete("/:discussionId", deleteDiscussion);
router.delete("/:discussionId/replies/:replyId", deleteReply);

export default router;
