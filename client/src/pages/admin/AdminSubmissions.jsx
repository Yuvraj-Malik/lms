import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  FileText, 
  Award, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  User, 
  ArrowRight,
  Filter 
} from "lucide-react";
import { adminApi, submissionApi } from "../../api/endpoints.js";
import { Card, Button, Input, Textarea, StatusBadge, Spinner, Alert, EmptyState } from "../../components/ui.jsx";
import { getErrorMessage } from "../../api/client.js";

function SubmissionItem({ submission, onGraded }) {
  const [marks, setMarks] = useState(
    submission.marks !== undefined && submission.marks !== null ? submission.marks : ""
  );
  const [feedback, setFeedback] = useState(submission.feedback || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const student = submission.student || {};
  const assignment = submission.assignment || {};
  const course = assignment.course || {};
  const maxMarks = assignment.maximumMarks || 100;
  const isGraded = submission.status === "graded";
  const isLate = submission.status === "late";

  const handleGrade = async () => {
    setError("");
    setSuccess(false);
    const num = Number(marks);
    if (isNaN(num) || num < 0 || num > maxMarks) {
      setError(`Marks must be a number between 0 and ${maxMarks}.`);
      return;
    }

    try {
      setSaving(true);
      const res = await submissionApi.grade(submission._id, { marks: num, feedback });
      setSuccess(true);
      if (onGraded) onGraded(res.data.submission);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const renderContent = () => {
    if (submission.submissionType === "file" && submission.fileUrl) {
      const fullUrl = submission.fileUrl.startsWith("http")
        ? submission.fileUrl
        : `${import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000"}${submission.fileUrl}`;
      return (
        <div className="flex items-center gap-2 mt-2">
          <a
            href={fullUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-[6px] border border-border-default bg-bg-surface-raised px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-bg-surface shadow-sm"
          >
            <FileText size={14} className="text-primary-600 dark:text-primary-400" />
            Download: {submission.fileOriginalName || "Attached Student File"}
            <ExternalLink size={12} className="ml-1 text-text-tertiary" />
          </a>
        </div>
      );
    }

    if (["github", "drive", "url"].includes(submission.submissionType) && submission.submissionLink) {
      return (
        <div className="mt-2">
          <a
            href={submission.submissionLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-[6px] border border-border-default bg-bg-surface-raised px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline shadow-sm"
          >
            <ExternalLink size={13} />
            {submission.submissionLink}
          </a>
        </div>
      );
    }

    if (submission.textContent) {
      return (
        <div className="mt-2 rounded-[6px] border border-border-subtle bg-bg-surface-raised p-3 text-xs leading-relaxed text-text-secondary whitespace-pre-line max-h-48 overflow-y-auto">
          {submission.textContent}
        </div>
      );
    }

    return <p className="text-xs text-text-tertiary mt-1 italic">No content recorded.</p>;
  };

  return (
    <Card className="p-6 space-y-4">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-border-subtle pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="type-caption text-text-tertiary">
              {course.title || "Course"}
            </span>
            <span className="text-text-tertiary">&bull;</span>
            <span className="type-caption text-primary-600 dark:text-primary-400">
              {assignment.title || "Assignment"}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3">
            <p className="type-h3 text-text-primary">
              {student.name || "Student"}
            </p>
            <span className="text-xs text-text-secondary">({student.email})</span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <StatusBadge
            status={isGraded ? "completed" : isLate ? "overdue" : "pending"}
            label={isGraded ? `Graded: ${submission.marks}/${maxMarks}` : isLate ? "Late Submission" : "Pending Review"}
          />
        </div>
      </div>

      {/* Submitted Content Preview */}
      <div>
        <label className="type-caption text-text-tertiary block mb-1">
          Submitted Artifact ({submission.submissionType}):
        </label>
        {renderContent()}
      </div>

      {/* Evaluation Box */}
      <div className="rounded-[8px] border border-border-subtle bg-bg-surface-raised p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="type-h3 text-text-primary flex items-center gap-1.5 text-xs">
            <Award size={15} className="text-primary-600 dark:text-primary-400" />
            {isGraded ? "Update Evaluation" : "Evaluate & Score Work"}
          </label>
          <span className="type-caption text-text-tertiary">
            Maximum Marks: <strong className="text-text-primary">{maxMarks}</strong>
          </span>
        </div>

        {error && <Alert tone="danger">{error}</Alert>}
        {success && <Alert tone="success">Grade recorded. Student notified.</Alert>}

        <div className="grid gap-3 sm:grid-cols-[140px_1fr_auto]">
          <div>
            <label className="block type-caption text-text-secondary mb-1">
              Score (0 - {maxMarks})
            </label>
            <input
              type="number"
              min={0}
              max={maxMarks}
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              placeholder={`Max ${maxMarks}`}
              className="w-full rounded-[6px] border border-border-default bg-bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block type-caption text-text-secondary mb-1">
              Instructor Comments
            </label>
            <input
              type="text"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. Logic is sound. Need additional error handling on boundary cases."
              className="w-full rounded-[6px] border border-border-default bg-bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div className="flex items-end">
            <Button
              variant={isGraded ? "secondary" : "primary"}
              onClick={handleGrade}
              disabled={saving || marks === ""}
              className="w-full sm:w-auto"
            >
              {saving ? "Saving…" : isGraded ? "Update Score" : "Submit Score"}
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
  const [activeTab, setActiveTab] = useState("pending");

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await adminApi.submissions();
      setSubmissions(res.data?.submissions || []);
    } catch (err) {
      console.error("Failed to fetch admin submissions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleRowGraded = (updated) => {
    setSubmissions((prev) =>
      prev.map((s) => (s._id === updated._id ? { ...s, ...updated } : s))
    );
  };

  const pendingList = submissions.filter((s) => s.status !== "graded");
  const gradedList = submissions.filter((s) => s.status === "graded");

  let filtered = submissions;
  if (activeTab === "pending") filtered = pendingList;
  if (activeTab === "graded") filtered = gradedList;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="type-display text-text-primary">
            Submissions Hub
          </h1>
          <p className="mt-1 type-body text-text-secondary">
            Review student submissions across enrolled courses and record evaluations
          </p>
        </div>
      </div>

      {/* Segmented Filter Tabs */}
      <div className="flex gap-1 rounded-[8px] border border-border-subtle bg-bg-surface-raised p-1">
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex-1 rounded-[6px] px-4 py-2 text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "pending"
              ? "bg-bg-surface text-text-primary shadow-sm font-semibold"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <Clock size={14} />
          Pending Review ({pendingList.length})
        </button>

        <button
          onClick={() => setActiveTab("graded")}
          className={`flex-1 rounded-[6px] px-4 py-2 text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "graded"
              ? "bg-bg-surface text-text-primary shadow-sm font-semibold"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <CheckCircle2 size={14} />
          Graded ({gradedList.length})
        </button>

        <button
          onClick={() => setActiveTab("all")}
          className={`flex-1 rounded-[6px] px-4 py-2 text-sm font-medium transition-all ${
            activeTab === "all"
              ? "bg-bg-surface text-text-primary shadow-sm font-semibold"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          All Submissions ({submissions.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No submissions found"
          description="Submissions will appear here once students submit assignments."
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
