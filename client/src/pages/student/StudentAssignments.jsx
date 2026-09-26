import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  Filter,
  Calendar,
  Layers,
  Award
} from "lucide-react";
import { assignmentApi, enrollmentApi } from "../../api/endpoints.js";
import { Card, Button, StatusBadge, EmptyState, Spinner } from "../../components/ui.jsx";

export default function StudentAssignments() {
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [enrRes, assignRes, subRes] = await Promise.all([
          enrollmentApi.my(),
          assignmentApi.myAssignments(),
          assignmentApi.mySubmissions(),
        ]);

        setEnrollments(enrRes.data?.enrollments || []);
        setAssignments(assignRes.data?.assignments || []);
        setSubmissions(subRes.data?.submissions || []);
      } catch (err) {
        console.error("Failed to fetch assignment hub data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner size={28} />
      </div>
    );
  }

  // Map submissions by assignment ID
  const submissionMap = new Map();
  submissions.forEach((s) => {
    const assignId = s.assignment?._id || s.assignment;
    if (assignId) submissionMap.set(String(assignId), s);
  });

  const now = new Date();

  // Categorize
  const submittedItems = [];
  const gradedItems = [];
  const notSubmittedItems = [];
  const overdue = [];

  assignments.forEach((a) => {
    const s = submissionMap.get(String(a._id));
    const isPastDeadline = a.deadline && new Date(a.deadline) < now;

    if (s) {
      if (s.status === "graded") {
        gradedItems.push({
          ...a,
          submission: s,
          category: "graded",
          marks: s.marks,
          feedback: s.feedback,
        });
      } else {
        submittedItems.push({
          ...a,
          submission: s,
          category: "submitted",
          submissionDate: s.createdAt,
        });
      }
    } else {
      const item = {
        ...a,
        category: "unsubmitted",
        isOverdue: isPastDeadline,
      };
      notSubmittedItems.push(item);
      if (isPastDeadline) overdue.push(item);
    }
  });

  const allItems = [...notSubmittedItems, ...submittedItems, ...gradedItems];

  // Filter based on active tab
  let displayedItems = [];
  if (activeTab === "all") displayedItems = allItems;
  else if (activeTab === "unsubmitted") displayedItems = notSubmittedItems;
  else if (activeTab === "submitted") displayedItems = submittedItems;
  else if (activeTab === "graded") displayedItems = gradedItems;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="type-display text-text-primary">
            Assignments Hub
          </h1>
          <p className="mt-1 type-body text-text-secondary">
            Submissions, deadlines, and evaluations across enrolled courses
          </p>
        </div>
      </div>

      {/* Segmented Filter Tabs */}
      <div className="flex gap-1 rounded-[8px] border border-border-subtle bg-bg-surface-raised p-1">
        <button
          onClick={() => setActiveTab("all")}
          className={`flex-1 rounded-[6px] px-4 py-2 text-sm font-medium transition-all ${
            activeTab === "all"
              ? "bg-bg-surface text-text-primary shadow-sm font-semibold"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          All ({allItems.length})
        </button>

        <button
          onClick={() => setActiveTab("unsubmitted")}
          className={`flex-1 rounded-[6px] px-4 py-2 text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "unsubmitted"
              ? "bg-bg-surface text-text-primary shadow-sm font-semibold"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <span>Unsubmitted ({notSubmittedItems.length})</span>
          {overdue.length > 0 && (
            <span className="rounded-[4px] bg-rose-500/15 px-1.5 py-0.2 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
              {overdue.length} overdue
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("submitted")}
          className={`flex-1 rounded-[6px] px-4 py-2 text-sm font-medium transition-all ${
            activeTab === "submitted"
              ? "bg-bg-surface text-text-primary shadow-sm font-semibold"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          Submitted ({submittedItems.length})
        </button>

        <button
          onClick={() => setActiveTab("graded")}
          className={`flex-1 rounded-[6px] px-4 py-2 text-sm font-medium transition-all ${
            activeTab === "graded"
              ? "bg-bg-surface text-text-primary shadow-sm font-semibold"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          Graded ({gradedItems.length})
        </button>
      </div>

      {/* Assignment List */}
      {displayedItems.length === 0 ? (
        <EmptyState
          title="No assignments found"
          description="There are no assignments in this category."
        />
      ) : (
        <div className="grid gap-4">
          {displayedItems.map((item, idx) => {
            const isOverdue = item.isOverdue;
            const isGraded = item.category === "graded";
            const isSubmitted = item.category === "submitted";
            const isUnsubmitted = item.category === "unsubmitted";

            const formattedDeadline = item.deadline
              ? new Date(item.deadline).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "N/A";

            const statusType = isGraded
              ? "completed"
              : isSubmitted
              ? "pending"
              : isOverdue
              ? "overdue"
              : "upcoming";

            const statusLabel = isGraded
              ? `Score: ${item.marks} / ${item.maximumMarks || 100}`
              : isSubmitted
              ? "Submitted · In Review"
              : isOverdue
              ? `Overdue · Due ${formattedDeadline}`
              : `Due ${formattedDeadline}`;

            return (
              <Card
                key={`${item._id || idx}-${item.category}`}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 transition-all duration-200 hover:border-border-default hover:shadow-raised ${
                  isOverdue ? "border-l-4 border-l-rose-500" : ""
                }`}
              >
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="type-h3 text-text-primary">
                      {item.title || "Assignment"}
                    </h3>
                    <StatusBadge status={statusType} label={statusLabel} />
                  </div>

                  <p className="type-body-sm text-text-secondary">
                    Course: <span className="font-medium text-text-primary">{item.course?.title || "General"}</span>
                    {item.maximumMarks && (
                      <span className="ml-3 text-text-tertiary">
                        Max Marks: {item.maximumMarks}
                      </span>
                    )}
                  </p>

                  {/* Feedback preview if graded */}
                  {isGraded && item.feedback && (
                    <div className="mt-3 rounded-[6px] border border-border-subtle bg-bg-surface-raised p-3 type-body-sm text-text-secondary">
                      <span className="font-semibold text-text-primary">Instructor Evaluation: </span>
                      "{item.feedback}"
                    </div>
                  )}

                  {isSubmitted && item.submissionDate && (
                    <p className="type-caption text-text-tertiary">
                      Submitted {new Date(item.submissionDate).toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Link to={`/dashboard/assignments/${item._id}`}>
                    <Button
                      size="sm"
                      variant={isUnsubmitted ? "primary" : "secondary"}
                      className="gap-1.5"
                    >
                      {isUnsubmitted ? "Submit Work" : isGraded ? "View Grade" : "View Submission"}
                      <ArrowUpRight size={14} />
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
