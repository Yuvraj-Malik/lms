import React, { useState, useEffect } from "react";
import { 
  MessageSquare, 
  ThumbsUp, 
  Send, 
  Plus, 
  CheckCircle2, 
  User, 
  Clock, 
  ShieldCheck, 
  Filter,
  X 
} from "lucide-react";
import { discussionApi } from "../api/endpoints.js";
import { getErrorMessage } from "../api/client.js";
import { Card, Button, Input, Textarea, Spinner, Alert, StatusBadge, Badge } from "./ui.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function CourseDiscussion({ courseId, courseTitle }) {
  const { user } = useAuth();
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("General");
  const [submitting, setSubmitting] = useState(false);
  const [replyTextMap, setReplyTextMap] = useState({});
  const [replyingMap, setReplyingMap] = useState({});
  const [error, setError] = useState("");

  const loadDiscussions = async () => {
    try {
      setLoading(true);
      const res = await discussionApi.forCourse(courseId);
      setDiscussions(res.data?.discussions || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      loadDiscussions();
    }
  }, [courseId]);

  const handleCreateThread = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    try {
      setSubmitting(true);
      setError("");
      const res = await discussionApi.create(courseId, {
        title: newTitle.trim(),
        content: newContent.trim(),
        category: newCategory,
      });
      setDiscussions((prev) => [res.data.discussion, ...prev]);
      setNewTitle("");
      setNewContent("");
      setShowCreateModal(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (discussionId) => {
    try {
      const res = await discussionApi.toggleUpvote(discussionId);
      setDiscussions((prev) =>
        prev.map((d) => (d._id === discussionId ? res.data.discussion : d))
      );
    } catch (err) {
      console.error("Upvote failed:", err);
    }
  };

  const handleAddReply = async (discussionId) => {
    const text = replyTextMap[discussionId];
    if (!text || !text.trim()) return;

    try {
      setReplyingMap((prev) => ({ ...prev, [discussionId]: true }));
      const res = await discussionApi.addReply(discussionId, { content: text.trim() });
      setDiscussions((prev) =>
        prev.map((d) => (d._id === discussionId ? res.data.discussion : d))
      );
      setReplyTextMap((prev) => ({ ...prev, [discussionId]: "" }));
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setReplyingMap((prev) => ({ ...prev, [discussionId]: false }));
    }
  };

  const categories = ["All", "General", "Module Question", "Assignment Help", "Bug/Issue"];

  const filtered = selectedCategory === "All"
    ? discussions
    : discussions.filter((d) => d.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <h2 className="type-h2 text-text-primary flex items-center gap-2">
            <MessageSquare size={20} className="text-primary-500" />
            Course Discussion & Q&A
          </h2>
          <p className="type-body text-text-secondary mt-0.5">
            Ask technical questions, collaborate with peers, and receive verified instructor guidance
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          className="gap-1.5 shrink-0"
        >
          <Plus size={15} /> Start Discussion
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-sm px-3 py-1.5 type-caption font-medium transition-all ${
              selectedCategory === cat
                ? "bg-primary-600 text-white shadow-sm"
                : "border border-border-subtle bg-bg-surface text-text-secondary hover:text-text-primary hover:border-border-default"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {error && <Alert tone="danger">{error}</Alert>}

      {/* Create Modal */}
      {showCreateModal && (
        <Card className="p-6 border-primary-500/40 shadow-raised relative space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <h3 className="type-h3 text-text-primary">
              Ask a Question in {courseTitle}
            </h3>
            <button
              onClick={() => setShowCreateModal(false)}
              className="text-text-tertiary hover:text-text-primary transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleCreateThread} className="space-y-4">
            <Input
              label="Question Title"
              placeholder="e.g. Clarification on Promises vs Async/Await error handling"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />

            <div>
              <label className="block type-caption text-text-secondary mb-1">
                Category
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full rounded-sm border border-border-default bg-bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary-500 focus:outline-none"
              >
                <option value="General">General</option>
                <option value="Module Question">Module Question</option>
                <option value="Assignment Help">Assignment Help</option>
                <option value="Bug/Issue">Bug/Issue</option>
              </select>
            </div>

            <Textarea
              label="Details / Code Snippet"
              rows={4}
              required
              placeholder="Provide context, error messages, or specific lines of code where you need assistance…"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={submitting}>
                {submitting ? "Posting…" : "Post Question"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size={28} />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center space-y-2">
          <p className="type-h3 text-text-primary">No discussions yet</p>
          <p className="type-body text-text-secondary max-w-sm mx-auto">
            {selectedCategory === "All"
              ? "Have a question about this curriculum? Be the first student to start a thread."
              : `No questions under "${selectedCategory}".`}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((thread) => {
            const hasUpvoted = (thread.upvotes || []).includes(user?._id);
            const isReplying = replyingMap[thread._id] || false;
            const currentReplyText = replyTextMap[thread._id] || "";

            return (
              <Card key={thread._id} className="p-6 space-y-4 shadow-card">
                {/* Thread Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-sm bg-primary-600/10 px-2 py-0.5 type-caption font-semibold text-primary-400">
                        {thread.category}
                      </span>
                      <span className="type-caption text-text-tertiary">
                        {new Date(thread.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="type-h3 text-text-primary font-semibold">
                      {thread.title}
                    </h3>
                  </div>

                  <button
                    onClick={() => handleUpvote(thread._id)}
                    className={`inline-flex items-center gap-1.5 rounded-sm border px-3 py-1.5 type-caption font-medium transition-colors shrink-0 ${
                      hasUpvoted
                        ? "border-primary-500 bg-primary-600/15 text-primary-400 font-semibold"
                        : "border-border-subtle bg-bg-surface-raised text-text-secondary hover:text-text-primary hover:border-border-default"
                    }`}
                  >
                    <ThumbsUp size={13} />
                    <span>{thread.upvotes?.length || 0} Upvotes</span>
                  </button>
                </div>

                {/* Author Info & Content */}
                <div className="flex items-center gap-2 type-caption text-text-tertiary">
                  <span className="font-medium text-text-primary">
                    {thread.user?.name || "Student"}
                  </span>
                  {thread.user?.role === "admin" && (
                    <span className="rounded-sm bg-semantic-info/10 text-semantic-info px-1.5 py-0.2 text-[10px] font-bold">
                      Instructor
                    </span>
                  )}
                </div>

                <p className="type-body text-text-primary whitespace-pre-wrap leading-relaxed">
                  {thread.content}
                </p>

                {/* Replies Section */}
                <div className="space-y-3 border-t border-border-subtle pt-4">
                  <p className="type-caption text-text-secondary font-semibold">
                    {thread.replies?.length || 0} {thread.replies?.length === 1 ? "Response" : "Responses"}
                  </p>

                  {thread.replies && thread.replies.length > 0 && (
                    <div className="space-y-2.5 pl-2 sm:pl-4 border-l-2 border-border-subtle">
                      {thread.replies.map((reply, rIdx) => (
                        <div
                          key={rIdx}
                          className={`rounded-[8px] p-3 space-y-1.5 ${
                            reply.isInstructorAnswer
                              ? "bg-primary-600/10 border border-primary-500/30"
                              : "bg-bg-surface-raised/50 border border-border-subtle"
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-text-primary">
                                {reply.user?.name || "Participant"}
                              </span>
                              {reply.isInstructorAnswer && (
                                <span className="flex items-center gap-1 rounded-sm bg-primary-600 px-1.5 py-0.2 text-[10px] font-bold text-white uppercase">
                                  <ShieldCheck size={11} /> Faculty Response
                                </span>
                              )}
                            </div>
                            <span className="type-caption text-text-tertiary">
                              {new Date(reply.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="type-body-sm text-text-primary whitespace-pre-wrap">
                            {reply.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Input Box */}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Write a constructive reply or answer…"
                      value={currentReplyText}
                      onChange={(e) =>
                        setReplyTextMap((prev) => ({
                          ...prev,
                          [thread._id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleAddReply(thread._id);
                        }
                      }}
                      className="flex-1 rounded-sm border border-border-default bg-bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary-500 focus:outline-none"
                    />
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={isReplying || !currentReplyText.trim()}
                      onClick={() => handleAddReply(thread._id)}
                      className="gap-1 shrink-0"
                    >
                      <Send size={13} /> Reply
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
