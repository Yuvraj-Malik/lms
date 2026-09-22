import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  BookOpen, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Award, 
  Calendar, 
  ArrowUpRight,
  Filter
} from "lucide-react";
import { dashboardApi, submissionApi } from "../../api/endpoints.js";
import { Card, Badge, Spinner, EmptyState, Button } from "../../components/ui.jsx";

export default function StudentAssignments() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'unsubmitted' | 'submitted' | 'graded'
  const [pending, setPending] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [dashRes, subRes] = await Promise.all([
          dashboardApi.student(),
          submissionApi.my(),
        ]);
        setPending(dashRes.data.pendingAssignments || []);
        setOverdue(dashRes.data.overdueAssignments || []);
        setMySubmissions(subRes.data.submissions || []);
      } catch (err) {
        console.error("Error loading assignments:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={32} />
      </div>
    );
  }

  // Not Submitted list (Pending + Overdue)
  const notSubmittedItems = [
    ...overdue.map((a) => ({
      ...a,
      assignmentId: a._id,
      category: "unsubmitted",
      isOverdue: true,
    })),
    ...pending.map((a) => ({
      ...a,
      assignmentId: a._id,
      category: "unsubmitted",
      isOverdue: false,
    })),
  ];

  // Submitted (Pending Review) list
  const submittedItems = mySubmissions
    .filter((s) => s.status === "submitted" || s.status === "late")
    .map((s) => ({
      assignmentId: s.assignment?._id,
      title: s.assignment?.title,
      course: s.assignment?.course,
      deadline: s.assignment?.deadline,
      maximumMarks: s.assignment?.maximumMarks,
      submissionDate: s.submissionDate,
      category: "submitted",
      status: s.status,
      submissionId: s._id,
    }));

  // Graded list
  const gradedItems = mySubmissions
    .filter((s) => s.status === "graded")
    .map((s) => ({
      assignmentId: s.assignment?._id,
      title: s.assignment?.title,
      course: s.assignment?.course,
      deadline: s.assignment?.deadline,
      maximumMarks: s.assignment?.maximumMarks,
      marks: s.marks,
      feedback: s.feedback,
      submissionDate: s.submissionDate,
      category: "graded",
      status: "graded",
      submissionId: s._id,
    }));

  // All Items
  const allItems = [...notSubmittedItems, ...submittedItems, ...gradedItems];

  // Filter based on active tab
  let displayedItems = [];
  if (activeTab === "all") displayedItems = allItems;
  else if (activeTab === "unsubmitted") displayedItems = notSubmittedItems;
  else if (activeTab === "submitted") displayedItems = submittedItems;
  else if (activeTab === "graded") displayedItems = gradedItems;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink dark:text-dark-ink sm:text-3xl">
            Assignments Hub
          </h1>
          <p className="mt-1 text-sm text-ink-soft dark:text-dark-ink-soft">
            Track, complete, and review submissions and marks across all enrolled courses.
          </p>
        </div>
      </div>

      {/* Segmented Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3 dark:border-dark-border">
        <button
          onClick={() => setActiveTab("all")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
            activeTab === "all"
              ? "bg-pine text-white dark:bg-pine-light dark:text-dark-surface"
              : "bg-surface-sunken text-ink-soft hover:text-ink dark:bg-dark-surface-sunken dark:text-dark-ink-soft"
          }`}
        >
          All Assignments ({allItems.length})
        </button>

        <button
          onClick={() => setActiveTab("unsubmitted")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
            activeTab === "unsubmitted"
              ? "bg-clay text-white"
              : "bg-surface-sunken text-ink-soft hover:text-ink dark:bg-dark-surface-sunken dark:text-dark-ink-soft"
          }`}
        >
          <span className="flex h-2 w-2 rounded-full bg-clay animate-pulse" />
          Not Submitted ({notSubmittedItems.length})
          {overdue.length > 0 && (
            <span className="rounded bg-white/20 px-1 text-[10px] font-bold">
              {overdue.length} overdue
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("submitted")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
            activeTab === "submitted"
              ? "bg-blue-600 text-white"
              : "bg-surface-sunken text-ink-soft hover:text-ink dark:bg-dark-surface-sunken dark:text-dark-ink-soft"
          }`}
        >
          Submitted ({submittedItems.length})
        </button>

        <button
          onClick={() => setActiveTab("graded")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
            activeTab === "graded"
              ? "bg-emerald-600 text-white"
              : "bg-surface-sunken text-ink-soft hover:text-ink dark:bg-dark-surface-sunken dark:text-dark-ink-soft"
          }`}
        >
          <Award size={14} />
          Graded ({gradedItems.length})
        </button>
      </div>

      {/* Assignment List */}
      {displayedItems.length === 0 ? (
        <EmptyState
          title={`No ${activeTab === "all" ? "" : activeTab} assignments found`}
          description="You're either all caught up or haven't reached this stage yet."
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

            return (
              <Card
                key={`${item.assignmentId || idx}-${item.category}`}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 transition-shadow hover:shadow-md ${
                  isOverdue ? "border-l-4 border-l-clay" : ""
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-base font-semibold text-ink dark:text-dark-ink">
                      {item.title || "Assignment"}
                    </h3>

                    {/* Status Badge */}
                    {isGraded && (
                      <Badge tone="pine">
                        Graded: {item.marks} / {item.maximumMarks || 100} Marks
                      </Badge>
                    )}
                    {isSubmitted && (
                      <Badge tone="neutral">
                        Submitted &bull; Pending Review
                      </Badge>
                    )}
                    {isUnsubmitted && isOverdue && (
                      <Badge tone="clay" className="bg-red-500/10 text-red-600 dark:text-red-400">
                        Overdue &bull; Due {formattedDeadline}
                      </Badge>
                    )}
                    {isUnsubmitted && !isOverdue && (
                      <Badge tone="amber">
                        Upcoming &bull; Due {formattedDeadline}
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs font-medium text-ink-soft dark:text-dark-ink-soft">
                    Course: <span className="text-ink dark:text-dark-ink">{item.course?.title || "General"}</span>
                    {item.maximumMarks && (
                      <span className="ml-3 font-semibold text-pine dark:text-amber-light">
                        Max Marks: {item.maximumMarks}
                      </span>
                    )}
                  </p>

                  {/* Feedback preview if graded */}
                  {isGraded && item.feedback && (
                    <div className="mt-2 rounded-lg bg-emerald-50/60 p-2.5 text-xs text-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300">
                      <span className="font-semibold">Instructor Feedback: </span>
                      "{item.feedback}"
                    </div>
                  )}

                  {isSubmitted && item.submissionDate && (
                    <p className="text-[11px] text-ink-soft dark:text-dark-ink-soft">
                      Submitted on {new Date(item.submissionDate).toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                  <Link to={`/dashboard/assignments/${item.assignmentId}`}>
                    <Button
                      size="sm"
                      tone={isUnsubmitted ? (isOverdue ? "clay" : "pine") : "secondary"}
                      className="gap-1.5"
                    >
                      {isUnsubmitted ? "Submit Assignment" : isGraded ? "View Evaluation" : "View Submission"}
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
