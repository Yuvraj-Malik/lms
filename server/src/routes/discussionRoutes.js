import express from "express";
import {
  getCourseDiscussions,
  createDiscussion,
  addReply,
  toggleUpvote,
} from "../controllers/discussionController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/course/:courseId", protect, getCourseDiscussions);
router.post("/course/:courseId", protect, createDiscussion);
router.post("/:discussionId/reply", protect, addReply);
router.post("/:discussionId/upvote", protect, toggleUpvote);

export default router;
