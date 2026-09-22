import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  ClipboardCheck, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  Award, 
  Search,
  Filter,
  Check,
  AlertCircle
} from "lucide-react";
import { adminApi, submissionApi } from "../../api/endpoints.js";
import { getErrorMessage } from "../../api/client.js";
import { Card, Button, Input, Textarea, Badge, Spinner, Alert, EmptyState } from "../../components/ui.jsx";

function SubmissionItem({ submission, onGraded }) {
  const [marks, setMarks] = useState(submission.marks ?? "");
  const [feedback, setFeedback] = useState(submission.feedback || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const maxMarks = submission.assignment?.maximumMarks || 100;

  const handleGrade = async () => {
    setError("");
    setSuccess(false);
    const num = Number(marks);
    if (isNaN(num) || num < 0 || num > maxMarks) {
      setError(`Marks must be between 0 and ${maxMarks}`);
      return;
    }

    setSaving(true);
    try {
      const res = await submissionApi.grade(submission._id, { marks: num, feedback });
      setSuccess(true);
      onGraded(res.data.submission);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const renderContent = () => {
    if (submission.submissionType === "file") {
      const fileUrl = submission.filePath?.startsWith("http")
        ? submission.filePath
        : `${import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000"}${submission.filePath}`;

      return (
        <div className="flex items-center gap-2 rounded-lg bg-surface-sunken p-3 dark:bg-dark-surface-sunken">
          <Download size={16} className="text-pine dark:text-amber-light flex-shrink-0" />
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-pine hover:underline dark:text-amber-light truncate"
          >
            {submission.fileOriginalName || "Download Submitted File"}
          </a>
        </div>
      );
    }
    if (submission.submissionType === "link") {
      return (
        <div className="flex items-center gap-2 rounded-lg bg-surface-sunken p-3 dark:bg-dark-surface-sunken">
          <ExternalLink size={16} className="text-pine dark:text-amber-light flex-shrink-0" />
          <a
            href={submission.submissionLink}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium text-pine hover:underline dark:text-amber-light truncate"
          >
            {submission.submissionLink}
          </a>
        </div>
      );
    }
    return (
      <div className="rounded-lg bg-surface-sunken p-3 text-xs text-ink dark:bg-dark-surface-sunken dark:text-dark-ink whitespace-pre-wrap">
        {submission.textContent || "No text content submitted."}
      </div>
    );
  };

  const isGraded = submission.status === "graded";
  const isLate = submission.status === "late";

  return (
    <Card className="p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3 dark:border-dark-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base font-semibold text-ink dark:text-dark-ink">
              {submission.assignment?.title || "Assignment Submission"}
            </h3>
            <Badge tone={isGraded ? "pine" : isLate ? "clay" : "amber"}>
              {isGraded ? `Graded: ${submission.marks}/${maxMarks}` : isLate ? "Late Submission" : "Pending Review"}
            </Badge>
          </div>
          <p className="text-xs text-ink-soft dark:text-dark-ink-soft">
            Course: <span className="font-medium text-ink dark:text-dark-ink">{submission.assignment?.course?.title || "Course"}</span>
          </p>
        </div>

        <div className="text-xs text-ink-soft dark:text-dark-ink-soft sm:text-right">
          <p className="font-semibold text-ink dark:text-dark-ink">{submission.student?.name}</p>
          <p>{submission.student?.email}</p>
          <p className="text-[11px] mt-0.5">Submitted: {new Date(submission.submissionDate).toLocaleString()}</p>
        </div>
      </div>

      {/* Submitted Content View */}
      <div>
        <label className="text-[11px] font-bold text-ink-soft uppercase tracking-wider dark:text-dark-ink-soft block mb-1">
          Submitted Work ({submission.submissionType}):
        </label>
        {renderContent()}
      </div>

      {/* Inline Grading Form */}
      <div className="rounded-xl border border-border/80 bg-surface-sunken/40 p-4 dark:border-dark-border/80 dark:bg-dark-surface-sunken/40 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-ink dark:text-dark-ink flex items-center gap-1.5">
            <Award size={15} className="text-pine dark:text-amber-light" />
            {isGraded ? "Update Score & Feedback" : "Evaluate & Award Marks"}
          </label>
          <span className="text-xs text-ink-soft dark:text-dark-ink-soft">
            Maximum Marks: <strong className="text-ink dark:text-dark-ink">{maxMarks}</strong>
          </span>
        </div>

        {error && <Alert tone="clay">{error}</Alert>}
        {success && <Alert tone="pine">Grade and feedback saved! Student has been notified.</Alert>}

        <div className="grid gap-3 sm:grid-cols-[140px_1fr_auto]">
          <div>
            <label className="block text-[11px] font-medium text-ink-soft dark:text-dark-ink-soft mb-1">
              Score (0 - {maxMarks})
            </label>
            <input
              type="number"
              min={0}
              max={maxMarks}
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              placeholder={`Max ${maxMarks}`}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-pine focus:outline-none dark:border-dark-border dark:bg-dark-surface dark:text-dark-ink"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-ink-soft dark:text-dark-ink-soft mb-1">
              Constructive Feedback
            </label>
            <input
              type="text"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. Excellent implementation of database indexes and error handling."
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-pine focus:outline-none dark:border-dark-border dark:bg-dark-surface dark:text-dark-ink"
            />
          </div>

          <div className="flex items-end">
            <Button
              tone={isGraded ? "secondary" : "pine"}
              onClick={handleGrade}
              disabled={saving || marks === ""}
              className="w-full sm:w-auto"
            >
              {saving ? "Saving..." : isGraded ? "Update Grade" : "Submit Grade"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'pending' | 'graded'

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await adminApi.allSubmissions();
      setSubmissions(res.data.submissions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleRowGraded = (updatedSub) => {
    setSubmissions((prev) =>
      prev.map((s) => (s._id === updatedSub._id ? { ...s, ...updatedSub } : s))
    );
  };

  const pendingList = submissions.filter((s) => s.status === "submitted" || s.status === "late");
  const gradedList = submissions.filter((s) => s.status === "graded");

  let filtered = submissions;
  if (activeTab === "pending") filtered = pendingList;
  else if (activeTab === "graded") filtered = gradedList;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink dark:text-dark-ink sm:text-3xl">
            Submissions Hub
          </h1>
          <p className="mt-1 text-sm text-ink-soft dark:text-dark-ink-soft">
            Review student submissions across all courses, grade works inline, and post personalized feedback.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3 dark:border-dark-border">
        <button
          onClick={() => setActiveTab("all")}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
            activeTab === "all"
              ? "bg-pine text-white dark:bg-pine-light dark:text-dark-surface"
              : "bg-surface-sunken text-ink-soft hover:text-ink dark:bg-dark-surface-sunken dark:text-dark-ink-soft"
          }`}
        >
          All Submissions ({submissions.length})
        </button>

        <button
          onClick={() => setActiveTab("pending")}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
            activeTab === "pending"
              ? "bg-amber text-pine"
              : "bg-surface-sunken text-ink-soft hover:text-ink dark:bg-dark-surface-sunken dark:text-dark-ink-soft"
          }`}
        >
          <Clock size={14} />
          Pending Review ({pendingList.length})
        </button>

        <button
          onClick={() => setActiveTab("graded")}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
            activeTab === "graded"
              ? "bg-emerald-600 text-white"
              : "bg-surface-sunken text-ink-soft hover:text-ink dark:bg-dark-surface-sunken dark:text-dark-ink-soft"
          }`}
        >
          <CheckCircle2 size={14} />
          Graded ({gradedList.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={`No ${activeTab === "all" ? "" : activeTab} submissions found`}
          description="Submissions from enrolled students will appear here as soon as they turn in assignments."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((sub) => (
            <SubmissionItem key={sub._id} submission={sub} onGraded={handleRowGraded} />
          ))}
        </div>
      )}
    </div>
  );
}
