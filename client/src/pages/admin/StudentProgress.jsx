import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  User, 
  BookOpen, 
  Calendar, 
  Clock, 
  GraduationCap, 
  PlusCircle, 
  Trash2, 
  RotateCcw, 
  CalendarPlus, 
  CheckCircle2, 
  Award,
  AlertTriangle
} from "lucide-react";
import { adminApi } from "../../api/endpoints.js";
import { getErrorMessage } from "../../api/client.js";
import { Card, Badge, Spinner, EmptyState, Button, Alert } from "../../components/ui.jsx";
import ProgressBar from "../../components/ProgressBar.jsx";

export default function StudentProgress() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCourseToEnroll, setSelectedCourseToEnroll] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Modals / Dialogs
  const [resetConfirm, setResetConfirm] = useState(null); // submission object
  const [extendModal, setExtendModal] = useState(null); // assignment object
  const [newDeadline, setNewDeadline] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await adminApi.studentProgress(id);
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleEnrollCourse = async () => {
    if (!selectedCourseToEnroll) return;
    setMessage("");
    setError("");
    setEnrolling(true);
    try {
      await adminApi.enrollStudent({ studentId: id, courseId: selectedCourseToEnroll });
      setMessage("Student enrolled in course successfully.");
      setSelectedCourseToEnroll("");
      loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setEnrolling(false);
    }
  };

  const handleUnenrollCourse = async (courseId, courseTitle) => {
    if (!window.confirm(`Are you sure you want to unenroll this student from "${courseTitle}"?`)) {
      return;
    }
    setMessage("");
    setError("");
    try {
      await adminApi.unenrollStudent({ studentId: id, courseId });
      setMessage(`Unenrolled student from "${courseTitle}".`);
      loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleResetSubmission = async () => {
    if (!resetConfirm) return;
    setMessage("");
    setError("");
    try {
      await adminApi.resetSubmission(resetConfirm._id);
      setMessage("Submission has been reset. The student may now submit again.");
      setResetConfirm(null);
      loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleExtendDeadline = async () => {
    if (!extendModal || !newDeadline) return;
    setMessage("");
    setError("");
    try {
      await adminApi.extendDeadline({
        assignmentId: extendModal._id,
        newDeadline: new Date(newDeadline).toISOString(),
      });
      setMessage(`Deadline extended to ${new Date(newDeadline).toLocaleString()}.`);
      setExtendModal(null);
      setNewDeadline("");
      loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={32} />
      </div>
    );
  }

  if (!data || !data.student) {
    return (
      <div className="space-y-4">
        <Link to="/admin/students" className="text-xs font-semibold text-pine hover:underline dark:text-amber-light">
          ← Back to Students
        </Link>
        <EmptyState title="Student not found" description="Could not load records for this student identifier." />
      </div>
    );
  }

  const { student, enrollments = [], submissions = [], allCourses = [] } = data;

  // Filter courses available for manual enrollment
  const enrolledCourseIds = new Set(enrollments.map((e) => String(e.course?._id || e.course)));
  const availableCourses = allCourses.filter((c) => !enrolledCourseIds.has(String(c._id)));

  return (
    <div className="space-y-8">
      <div>
        <Link
          to="/admin/students"
          className="inline-flex items-center text-xs font-semibold text-pine hover:underline dark:text-amber-light"
        >
          ← Back to Students Directory
        </Link>
      </div>

      {message && <Alert tone="pine">{message}</Alert>}
      {error && <Alert tone="clay">{error}</Alert>}

      {/* Student Profile Card (MUST HAVE) */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-pine/10 text-2xl font-bold text-pine dark:bg-pine-light/10 dark:text-pine-light flex-shrink-0">
              {student.avatar ? (
                <img src={student.avatar} alt={student.name} className="h-full w-full rounded-2xl object-cover" />
              ) : (
                student.name?.[0]?.toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-bold text-ink dark:text-dark-ink sm:text-2xl">
                  {student.name}
                </h1>
                <Badge tone={student.isActive ? "pine" : "clay"}>
                  {student.isActive ? "Active Account" : "Deactivated"}
                </Badge>
              </div>
              <p className="text-xs text-ink-soft dark:text-dark-ink-soft">{student.email}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-soft dark:text-dark-ink-soft">
                <span className="flex items-center gap-1 font-medium text-ink dark:text-dark-ink">
                  <GraduationCap size={14} className="text-pine dark:text-amber-light" />
                  {student.department || "Computer Science & Engineering"}
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  Joined {new Date(student.createdAt).toLocaleDateString()}
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  Last Active: {new Date(student.lastLogin).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Enrolled Courses & Manual Enrollment (MUST HAVE) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-pine dark:text-amber-light" />
            <h2 className="font-display text-lg font-bold text-ink dark:text-dark-ink">
              Enrolled Courses ({enrollments.length})
            </h2>
          </div>

          {/* Manual Course Enrollment Form */}
          {availableCourses.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                value={selectedCourseToEnroll}
                onChange={(e) => setSelectedCourseToEnroll(e.target.value)}
                className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-ink focus:border-pine focus:outline-none dark:border-dark-border dark:bg-dark-surface dark:text-dark-ink"
              >
                <option value="">-- Enroll in a Course --</option>
                {availableCourses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title} ({c.category})
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                tone="pine"
                onClick={handleEnrollCourse}
                disabled={enrolling || !selectedCourseToEnroll}
                className="gap-1"
              >
                <PlusCircle size={14} />
                {enrolling ? "Enrolling..." : "Enroll Student"}
              </Button>
            </div>
          )}
        </div>

        {enrollments.length === 0 ? (
          <Card className="p-8 text-center text-sm text-ink-soft dark:text-dark-ink-soft">
            This student is not enrolled in any courses yet.
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {enrollments.map((e) => {
              const course = e.course || {};
              const isCompleted = e.status === "completed" || e.progress >= 100;
              const isInProgress = e.progress > 0 && !isCompleted;

              return (
                <Card key={e._id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-semibold text-amber uppercase dark:text-amber-light">
                        {course.category || "Track"}
                      </span>
                      <h3 className="font-display text-sm font-bold text-ink dark:text-dark-ink line-clamp-1">
                        {course.title || "Course"}
                      </h3>
                      <p className="text-[11px] text-ink-soft dark:text-dark-ink-soft">
                        Enrolled {new Date(e.enrollmentDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge tone={isCompleted ? "pine" : isInProgress ? "amber" : "neutral"}>
                      {isCompleted ? "Completed" : isInProgress ? "In Progress" : "Not Started"}
                    </Badge>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-ink-soft dark:text-dark-ink-soft mb-1">
                      <span>{e.completedModules?.length || 0} modules finished</span>
                      <span>{e.progress}%</span>
                    </div>
                    <ProgressBar value={e.progress} />
                  </div>

                  <div className="flex justify-end pt-2 border-t border-border/60 dark:border-dark-border/60">
                    <Button
                      size="xs"
                      tone="clay"
                      onClick={() => handleUnenrollCourse(course._id, course.title)}
                      className="gap-1"
                    >
                      <Trash2 size={12} /> Unenroll
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Assignment Submissions Table with Reset & Extend Deadline (MUST HAVE) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award size={20} className="text-pine dark:text-amber-light" />
            <h2 className="font-display text-lg font-bold text-ink dark:text-dark-ink">
              Assignment Submissions ({submissions.length})
            </h2>
          </div>
        </div>

        {submissions.length === 0 ? (
          <Card className="p-8 text-center text-sm text-ink-soft dark:text-dark-ink-soft">
            No submissions recorded yet for this student.
          </Card>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm dark:border-dark-border dark:bg-dark-surface">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-surface-sunken/60 text-xs font-semibold text-ink-soft uppercase dark:border-dark-border dark:bg-dark-surface-sunken/60 dark:text-dark-ink-soft">
                  <tr>
                    <th className="px-5 py-3.5">Assignment</th>
                    <th className="px-5 py-3.5">Course</th>
                    <th className="px-5 py-3.5">Submitted Date</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Score</th>
                    <th className="px-5 py-3.5">Feedback</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 dark:divide-dark-border/60">
                  {submissions.map((sub) => {
                    const assignment = sub.assignment || {};
                    const isGraded = sub.status === "graded";
                    const isLate = sub.status === "late";

                    return (
                      <tr key={sub._id} className="transition-colors hover:bg-surface-sunken/40 dark:hover:bg-dark-surface-sunken/40">
                        <td className="px-5 py-4 font-semibold text-ink dark:text-dark-ink">
                          {assignment.title || "Assignment"}
                        </td>
                        <td className="px-5 py-4 text-xs text-ink-soft dark:text-dark-ink-soft font-medium">
                          {assignment.course?.title || "Course"}
                        </td>
                        <td className="px-5 py-4 text-xs text-ink-soft dark:text-dark-ink-soft">
                          {new Date(sub.submissionDate).toLocaleString()}
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone={isGraded ? "pine" : isLate ? "clay" : "amber"}>
                            {isGraded ? "Graded" : isLate ? "Late" : "Pending Review"}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 font-mono text-xs font-semibold text-ink dark:text-dark-ink">
                          {isGraded ? `${sub.marks} / ${assignment.maximumMarks || 100}` : "—"}
                        </td>
                        <td className="px-5 py-4 text-xs text-ink-soft dark:text-dark-ink-soft max-w-xs truncate">
                          {sub.feedback ? `"${sub.feedback}"` : "None"}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Reset Submission Action */}
                            <Button
                              size="xs"
                              tone="secondary"
                              onClick={() => setResetConfirm(sub)}
                              title="Reset submission so student can resubmit"
                              className="gap-1"
                            >
                              <RotateCcw size={12} /> Reset
                            </Button>

                            {/* Extend Deadline Action */}
                            <Button
                              size="xs"
                              tone="secondary"
                              onClick={() => {
                                setExtendModal(assignment);
                                setNewDeadline(
                                  assignment.deadline
                                    ? new Date(assignment.deadline).toISOString().slice(0, 16)
                                    : ""
                                );
                              }}
                              title="Extend assignment deadline for this student"
                              className="gap-1"
                            >
                              <CalendarPlus size={12} /> Extend Deadline
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Reset Submission Confirmation Modal */}
      {resetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl dark:bg-dark-surface border border-border dark:border-dark-border">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber/15 text-amber">
                <RotateCcw size={20} />
              </div>
              <h3 className="font-display text-base font-bold text-ink dark:text-dark-ink">
                Reset Student Submission
              </h3>
            </div>
            <p className="mt-3 text-xs sm:text-sm text-ink-soft dark:text-dark-ink-soft leading-relaxed">
              Resetting this submission will delete the existing student work and score, allowing{" "}
              <strong>{student.name}</strong> to make a fresh submission for <strong>{resetConfirm.assignment?.title}</strong>.
            </p>
            <div className="mt-6 flex justify-end gap-2.5">
              <Button size="sm" tone="secondary" onClick={() => setResetConfirm(null)}>
                Cancel
              </Button>
              <Button size="sm" tone="clay" onClick={handleResetSubmission}>
                Confirm Reset
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Extend Deadline Modal */}
      {extendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl dark:bg-dark-surface border border-border dark:border-dark-border">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pine/15 text-pine dark:bg-pine-light/15 dark:text-pine-light">
                <CalendarPlus size={20} />
              </div>
              <h3 className="font-display text-base font-bold text-ink dark:text-dark-ink">
                Extend Assignment Deadline
              </h3>
            </div>
            <p className="mt-2 text-xs text-ink-soft dark:text-dark-ink-soft">
              Set a new deadline for <strong>{extendModal.title}</strong>:
            </p>

            <div className="mt-4">
              <input
                type="datetime-local"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-pine focus:outline-none dark:border-dark-border dark:bg-dark-surface dark:text-dark-ink"
              />
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <Button size="sm" tone="secondary" onClick={() => setExtendModal(null)}>
                Cancel
              </Button>
              <Button size="sm" tone="pine" onClick={handleExtendDeadline} disabled={!newDeadline}>
                Save Extended Deadline
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
