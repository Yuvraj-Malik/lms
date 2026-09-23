import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  CheckCircle2, 
  Circle, 
  ExternalLink, 
  BookOpen, 
  Award, 
  ChevronDown, 
  ChevronUp, 
  Info,
  Clock,
  FileText
} from "lucide-react";
import { courseApi, moduleApi, enrollmentApi } from "../../api/endpoints.js";
import { Card, Button, Spinner, Badge } from "../../components/ui.jsx";
import ProgressBar from "../../components/ProgressBar.jsx";

export default function CourseModules() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState(null);
  const [openId, setOpenId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [courseRes, modulesRes, statusRes] = await Promise.all([
        courseApi.get(courseId),
        moduleApi.listForCourse(courseId),
        enrollmentApi.status(courseId),
      ]);
      setCourse(courseRes.data.course);
      const sortedMods = (modulesRes.data.modules || []).sort(
        (a, b) => a.moduleOrder - b.moduleOrder
      );
      setModules(sortedMods);
      setEnrollment(statusRes.data.enrollment);
      // Auto open the first incomplete module or the first module
      if (sortedMods.length > 0) {
        const completedSet = new Set(statusRes.data.enrollment?.completedModules || []);
        const firstIncomplete = sortedMods.find((m) => !completedSet.has(m._id));
        setOpenId(firstIncomplete ? firstIncomplete._id : sortedMods[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const handleComplete = async (moduleId) => {
    setCompletingId(moduleId);
    try {
      const { data } = await moduleApi.complete(moduleId);
      setEnrollment(data.enrollment);
    } finally {
      setCompletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={32} />
      </div>
    );
  }
  if (!course || !enrollment) return null;

  const completedCount = enrollment.completedModules?.length || 0;
  const totalCount = modules.length;
  const isAllCompleted = totalCount > 0 && completedCount >= totalCount;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          to="/dashboard/my-courses"
          className="inline-flex items-center text-xs font-semibold text-pine hover:underline dark:text-amber-light"
        >
          ← Back to Enrolled Courses
        </Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold tracking-wide text-amber uppercase dark:text-amber-light">
              {course.category}
            </span>
            <h1 className="font-display text-2xl font-bold text-ink dark:text-dark-ink sm:text-3xl">
              {course.title}
            </h1>
          </div>
          <Link to={`/dashboard/my-courses/${course._id}/details`}>
            <Button size="xs" tone="secondary">
              Course Syllabus & Details
            </Button>
          </Link>
        </div>
      </div>

      {/* Explicit Completion Requirement & Progress Banner (MUST HAVE) */}
      <Card className="border-pine/30 bg-gradient-to-r from-pine/5 via-surface to-surface p-5 dark:border-pine-light/30 dark:from-pine-light/5 dark:via-dark-surface dark:to-dark-surface">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-pine dark:text-amber-light" />
              <h2 className="font-display text-sm font-bold text-ink dark:text-dark-ink">
                Module Completion Policy
              </h2>
            </div>
            <p className="text-xs text-ink-soft dark:text-dark-ink-soft max-w-xl">
              Study the materials and lecture notes in each module, then click <strong className="text-ink dark:text-dark-ink">"Mark as Complete"</strong>. Finishing all {totalCount} modules will graduate you to 100% and generate your verified <strong className="text-pine dark:text-amber-light">Certificate of Completion</strong>.
            </p>
          </div>

          <div className="flex flex-col sm:items-end flex-shrink-0">
            <span className="text-xs font-semibold text-ink dark:text-dark-ink">
              {completedCount} of {totalCount} modules completed ({enrollment.progress}%)
            </span>
            <div className="w-48 mt-1.5">
              <ProgressBar value={enrollment.progress} />
            </div>
            {isAllCompleted && (
              <span className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <Award size={12} /> Certificate Unlocked on Profile!
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Module List Accordion */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-display text-lg font-bold text-ink dark:text-dark-ink">
            Course Curriculum ({modules.length} Modules)
          </h2>
          <span className="text-xs text-ink-soft dark:text-dark-ink-soft">
            Click module to view lessons & resources
          </span>
        </div>

        {modules.map((m) => {
          const done = enrollment.completedModules?.includes(m._id);
          const open = openId === m._id;

          return (
            <Card
              key={m._id}
              className={`transition-all ${
                done ? "border-emerald-500/30 bg-emerald-500/5 dark:border-emerald-500/20" : ""
              }`}
            >
              <button
                onClick={() => setOpenId(open ? null : m._id)}
                className="flex w-full items-center justify-between text-left focus:outline-none"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex-shrink-0">
                    {done ? (
                      <CheckCircle2 size={22} className="text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Circle size={22} className="text-ink-soft dark:text-dark-ink-soft" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-ink-soft dark:text-dark-ink-soft">
                        Module {m.moduleOrder}
                      </span>
                      {done && (
                        <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                          COMPLETED
                        </span>
                      )}
                    </div>
                    <p className="font-display text-sm font-semibold text-ink dark:text-dark-ink">
                      {m.title}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-ink-soft dark:text-dark-ink-soft">
                  <span className="text-xs hidden sm:inline">
                    {open ? "Hide details" : "Expand"}
                  </span>
                  {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </button>

              {open && (
                <div className="mt-4 border-t border-border pt-4 dark:border-dark-border space-y-4">
                  {m.description && (
                    <p className="text-xs font-medium text-ink-soft dark:text-dark-ink-soft">
                      {m.description}
                    </p>
                  )}

                  {m.notes && (
                    <div className="rounded-xl border border-border/80 bg-surface-sunken/60 p-4 text-xs leading-relaxed text-ink dark:border-dark-border/80 dark:bg-dark-surface-sunken/60 dark:text-dark-ink">
                      <div className="flex items-center gap-1.5 font-semibold text-ink dark:text-dark-ink mb-2">
                        <FileText size={14} className="text-pine dark:text-amber-light" />
                        Lecture Notes & Study Guide:
                      </div>
                      <p className="whitespace-pre-line text-ink-soft dark:text-dark-ink-soft">
                        {m.notes}
                      </p>
                    </div>
                  )}

                  {m.resourceLinks?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-ink dark:text-dark-ink mb-2">
                        Attached Resources & Documentation:
                      </h4>
                      <ul className="space-y-1.5">
                        {m.resourceLinks.map((link, i) => (
                          <li key={i}>
                            <a
                              href={link}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-md bg-surface-raised px-2.5 py-1 text-xs font-medium text-pine hover:underline dark:bg-dark-surface-raised dark:text-amber-light"
                            >
                              <ExternalLink size={12} /> {link}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-border/50 dark:border-dark-border/50">
                    <span className="text-xs text-ink-soft dark:text-dark-ink-soft">
                      Status: {done ? "Completed" : "Incomplete"}
                    </span>
                    {!done ? (
                      <Button
                        tone="pine"
                        size="sm"
                        onClick={() => handleComplete(m._id)}
                        disabled={completingId === m._id}
                        className="gap-1.5"
                      >
                        <CheckCircle2 size={14} />
                        {completingId === m._id ? "Updating progress..." : "Mark as Complete"}
                      </Button>
                    ) : (
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={14} /> Verified Complete
                      </span>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}

        {modules.length === 0 && (
          <Card className="p-8 text-center text-sm text-ink-soft dark:text-dark-ink-soft">
            No modules published yet for this course.
          </Card>
        )}
      </div>
    </div>
  );
}
