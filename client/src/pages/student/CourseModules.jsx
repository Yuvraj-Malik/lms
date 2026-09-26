import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  BookOpen, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  ExternalLink,
  Award,
  ArrowLeft,
  CircleDot
} from "lucide-react";
import { courseApi, enrollmentApi } from "../../api/endpoints.js";
import { getErrorMessage } from "../../api/client.js";
import { Card, Button, Spinner, Alert, StatusBadge } from "../../components/ui.jsx";
import ProgressBar from "../../components/ProgressBar.jsx";

export default function CourseModules() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [openModuleId, setOpenModuleId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState(null);
  const [error, setError] = useState("");

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const [cRes, eRes] = await Promise.all([
        courseApi.get(id),
        enrollmentApi.my(),
      ]);

      setCourse(cRes.data?.course);
      const sortedMods = (cRes.data?.modules || []).sort(
        (a, b) => a.moduleOrder - b.moduleOrder
      );
      setModules(sortedMods);

      const myEnr = (eRes.data?.enrollments || []).find(
        (e) => (e.course?._id || e.course) === id
      );
      setEnrollment(myEnr || null);

      if (sortedMods.length > 0 && !openModuleId) {
        const completedSet = new Set(myEnr?.completedModules || []);
        const firstIncomplete = sortedMods.find((m) => !completedSet.has(m._id));
        setOpenModuleId(firstIncomplete ? firstIncomplete._id : sortedMods[0]._id);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseData();
  }, [id]);

  const handleComplete = async (modId) => {
    try {
      setCompletingId(modId);
      const res = await enrollmentApi.completeModule(id, modId);
      setEnrollment(res.data.enrollment);
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setCompletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner size={28} />
      </div>
    );
  }

  if (!course || !enrollment) return null;

  const completedModules = new Set(enrollment.completedModules || []);
  const completedCount = completedModules.size;
  const totalCount = modules.length;
  const isAllCompleted = totalCount > 0 && completedCount >= totalCount;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Back button and Course Header */}
      <div>
        <Link
          to="/dashboard/my-courses"
          className="inline-flex items-center gap-1.5 type-body-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={14} /> Back to Enrolled Courses
        </Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="type-caption text-primary-600 dark:text-primary-400">
              {course.category}
            </span>
            <h1 className="type-display text-text-primary mt-1">
              {course.title}
            </h1>
          </div>
          <Link to={`/dashboard/my-courses/${course._id}/details`}>
            <Button size="sm" variant="secondary">
              Course Syllabus
            </Button>
          </Link>
        </div>
      </div>

      {/* Completion Requirement & Progress Banner */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-primary-600 dark:text-primary-400" />
              <h2 className="type-h3 text-text-primary">
                Module Completion Requirements
              </h2>
            </div>
            <p className="type-body-sm text-text-secondary max-w-xl">
              Review syllabus materials in each module and mark lessons complete. Finishing all {totalCount} modules generates your accredited completion certificate.
            </p>
          </div>

          <div className="flex flex-col sm:items-end shrink-0">
            <span className="type-caption text-text-primary font-semibold">
              {completedCount} of {totalCount} completed ({enrollment.progress}%)
            </span>
            <div className="w-48 mt-2">
              <ProgressBar value={enrollment.progress} />
            </div>
            {isAllCompleted && (
              <span className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <Award size={13} /> Certificate available on profile
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Module List Accordion */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="type-h3 text-text-primary">
            Curriculum Modules ({modules.length})
          </h2>
          <span className="type-caption text-text-tertiary">
            Select module to view lessons
          </span>
        </div>

        {modules.map((m) => {
          const done = completedModules.has(m._id);
          const open = openModuleId === m._id;

          return (
            <Card
              key={m._id}
              className={`p-5 transition-all duration-150 ${
                open ? "border-primary-500/30" : ""
              }`}
            >
              <button
                onClick={() => setOpenModuleId(open ? null : m._id)}
                className="flex w-full items-center justify-between text-left focus:outline-none"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] border text-xs font-semibold ${
                      done
                        ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border-border-subtle bg-bg-surface-raised text-text-secondary"
                    }`}
                  >
                    {done ? <CheckCircle2 size={16} /> : m.moduleOrder}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="type-caption text-text-tertiary">
                        Module {m.moduleOrder}
                      </span>
                      {done && (
                        <span className="rounded-[4px] bg-emerald-500/10 px-1.5 py-0.2 text-[10px] font-semibold uppercase text-emerald-700 dark:text-emerald-400">
                          Complete
                        </span>
                      )}
                    </div>
                    <p className="type-h3 text-text-primary truncate mt-0.5">
                      {m.title}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-text-secondary">
                  <span className="type-caption hidden sm:inline">
                    {open ? "Collapse" : "Expand"}
                  </span>
                  {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>

              {open && (
                <div className="mt-4 border-t border-border-subtle pt-4 space-y-4">
                  {m.description && (
                    <p className="type-body text-text-secondary">
                      {m.description}
                    </p>
                  )}

                  {m.notes && (
                    <div className="rounded-[6px] border border-border-subtle bg-bg-surface-raised p-4 text-xs leading-relaxed text-text-primary">
                      <div className="flex items-center gap-1.5 font-semibold text-text-primary mb-2">
                        <FileText size={14} className="text-primary-600 dark:text-primary-400" />
                        Lecture Notes & Study Material:
                      </div>
                      <p className="whitespace-pre-line type-body-sm text-text-secondary">
                        {m.notes}
                      </p>
                    </div>
                  )}

                  {m.resourceLinks?.length > 0 && (
                    <div>
                      <h4 className="type-caption text-text-tertiary mb-2">
                        Attached Resources:
                      </h4>
                      <ul className="space-y-1.5">
                        {m.resourceLinks.map((link, i) => (
                          <li key={i}>
                            <a
                              href={link}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-[4px] bg-bg-surface-raised px-2.5 py-1 type-body-sm text-primary-600 hover:underline dark:text-primary-400"
                            >
                              <ExternalLink size={12} /> {link}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
                    <span className="type-body-sm text-text-secondary">
                      Status: {done ? "Completed" : "Pending completion"}
                    </span>
                    {!done ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleComplete(m._id)}
                        disabled={completingId === m._id}
                        className="gap-1.5"
                      >
                        <CheckCircle2 size={14} />
                        {completingId === m._id ? "Saving…" : "Mark as Complete"}
                      </Button>
                    ) : (
                      <span className="type-body-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={14} /> Completed
                      </span>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}

        {modules.length === 0 && (
          <Card className="p-8 text-center type-body text-text-secondary">
            No modules published yet for this course.
          </Card>
        )}
      </div>
    </div>
  );
}
