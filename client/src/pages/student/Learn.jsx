import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight, ExternalLink, Lock } from "lucide-react";
import { assignmentApi, courseApi, moduleApi } from "../../api/endpoints.js";
import { getErrorMessage } from "../../api/client.js";
import useAsync from "../../lib/useAsync.js";
import { dueLabel, assignmentState } from "../../lib/format.js";
import ModuleQuiz from "../../components/ModuleQuiz.jsx";
import CourseDiscussion from "../../components/CourseDiscussion.jsx";
import StudyNotes from "../../components/StudyNotes.jsx";
import { Button, EmptyState, ErrorState, Notice, PageHeader, PageLoader, ProgressBar, StatusBadge, Tabs, cx, useFeedback } from "../../components/ui.jsx";

const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

export default function Learn() {
  const { courseId } = useParams();
  const [params, setParams] = useSearchParams();
  const { toast } = useFeedback();
  const [tab, setTab] = useState(params.get("tab") || "modules");
  const [completing, setCompleting] = useState(false);

  const { data, loading, error, reload, setData } = useAsync(async () => {
    const [course, mods, asg] = await Promise.all([
      courseApi.get(courseId),
      moduleApi.listForCourse(courseId),
      assignmentApi.listForCourse(courseId),
    ]);
    return { course: course.data.course, modules: mods.data.modules, enrollment: mods.data.enrollment, assignments: asg.data.assignments };
  }, [courseId]);

  const completed = useMemo(() => new Set((data?.enrollment?.completedModules || []).map(String)), [data?.enrollment]);

  if (loading) return <PageLoader />;
  if (error) {
    return (
      <>
        <PageHeader back={{ to: "/dashboard/courses", label: "My courses" }} title="Course" />
        {/forbidden|enroll/i.test(error) ? (
          <div className="rounded-lg border border-line bg-surface">
            <EmptyState icon={Lock} title="You're not enrolled in this course" description={error} action={<Button to={`/dashboard/courses/${courseId}`} variant="primary">View course</Button>} />
          </div>
        ) : (
          <ErrorState message={error} onRetry={reload} />
        )}
      </>
    );
  }

  const { course, modules, enrollment, assignments } = data;
  const currentId = params.get("module") || modules.find((m) => !completed.has(String(m._id)))?._id || modules[0]?._id;
  const index = Math.max(0, modules.findIndex((m) => m._id === currentId));
  const current = modules[index];
  const isDone = current && completed.has(String(current._id));

  const goTo = (id) => {
    const next = new URLSearchParams(params);
    next.set("module", id);
    next.delete("tab");
    setParams(next, { replace: false });
    setTab("modules");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const applyEnrollment = (enr) => setData((d) => ({ ...d, enrollment: enr }));

  const markComplete = async () => {
    setCompleting(true);
    try {
      const { data: res } = await moduleApi.complete(current._id);
      applyEnrollment(res.enrollment);
      toast(res.enrollment.status === "completed" ? "Course complete — your certificate is ready." : "Module marked complete.");
    } catch (err) {
      toast(getErrorMessage(err), "danger");
    } finally {
      setCompleting(false);
    }
  };

  const onQuizResult = (res) => {
    if (res.enrollment) applyEnrollment(res.enrollment);
    // Remember the best score locally so the sidebar and header update without a reload
    setData((d) => ({
      ...d,
      modules: d.modules.map((m) =>
        m._id === current._id
          ? { ...m, quizResult: !m.quizResult || res.score >= m.quizResult.score ? { score: res.score, total: res.total, passed: res.passed || m.quizResult?.passed, attempts: (m.quizResult?.attempts || 0) + 1 } : { ...m.quizResult, attempts: m.quizResult.attempts + 1 } }
          : m
      ),
    }));
  };

  const openAssignments = assignments.filter((a) => !a.mySubmission).length;

  return (
    <>
      <PageHeader
        back={{ to: "/dashboard/courses", label: "My courses" }}
        eyebrow={course.category}
        title={course.title}
        actions={
          <Button to={`/dashboard/courses/${course._id}`} variant="ghost" size="sm">
            Course info
          </Button>
        }
      >
        <div className="mt-4 flex max-w-md items-center gap-3">
          <ProgressBar value={enrollment.progress} tone={enrollment.status === "completed" ? "ok" : "accent"} />
          <span className="tabular shrink-0 text-[13px] text-fg-muted">
            {enrollment.completedModules.length}/{modules.length} modules
          </span>
        </div>
      </PageHeader>

      {enrollment.status === "completed" && (
        <Notice
          tone="ok"
          title="You've completed this course"
          className="mb-5"
          action={
            <Button size="sm" to={`/dashboard/certificates/${enrollment._id}`}>
              View certificate
            </Button>
          }
        />
      )}

      <Tabs
        className="mb-5"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "modules", label: "Modules", count: modules.length },
          { value: "assignments", label: "Assignments", count: openAssignments || undefined },
          { value: "discussion", label: "Discussion" },
          { value: "notes", label: "My notes" },
        ]}
      />

      {tab === "modules" &&
        (modules.length === 0 ? (
          <div className="rounded-lg border border-line bg-surface">
            <EmptyState title="No modules yet" description="Your instructor hasn't added any content to this course yet." />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
            <nav aria-label="Modules" className="lg:sticky lg:top-6 lg:self-start">
              <ol className="overflow-hidden rounded-lg border border-line bg-surface">
                {modules.map((m) => {
                  const done = completed.has(String(m._id));
                  const active = m._id === current._id;
                  return (
                    <li key={m._id} className="border-b border-line last:border-0">
                      <button
                        onClick={() => goTo(m._id)}
                        className={cx("flex w-full items-start gap-3 px-3.5 py-2.5 text-left text-[13px] transition-colors", active ? "bg-muted" : "hover:bg-subtle")}
                      >
                        <span
                          className={cx(
                            "tabular mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px]",
                            done ? "border-ok bg-ok text-white dark:text-[#0c1a15]" : "border-line-strong text-fg-muted"
                          )}
                        >
                          {done ? <Check size={12} strokeWidth={3} /> : m.moduleOrder}
                        </span>
                        <span className={cx("min-w-0 flex-1", active ? "font-medium text-fg" : "text-fg-muted")}>{m.title}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </nav>

            <article className="min-w-0 rounded-lg border border-line bg-surface">
              <div className="border-b border-line px-6 py-5">
                <div className="text-[13px] text-fg-muted">
                  Module {current.moduleOrder} of {modules.length}
                </div>
                <h2 className="mt-1 text-xl font-semibold">{current.title}</h2>
                {current.description && <p className="mt-2 text-sm text-fg-muted">{current.description}</p>}
              </div>

              <div className="space-y-6 px-6 py-6">
                {current.notes ? (
                  <div className="prose-notes text-[15px]">{current.notes}</div>
                ) : (
                  <p className="text-sm text-fg-muted">No written notes for this module.</p>
                )}

                {current.resourceLinks?.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold">Resources</h3>
                    <ul className="divide-y divide-line rounded-md border border-line">
                      {current.resourceLinks.map((url) => (
                        <li key={url}>
                          <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-subtle">
                            <ExternalLink size={14} className="shrink-0 text-fg-subtle" />
                            <span className="min-w-0 flex-1 truncate">{url.replace(/^https?:\/\//, "")}</span>
                            <span className="hidden shrink-0 text-xs text-fg-subtle sm:inline">{hostOf(url)}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {current.quiz?.length > 0 && <ModuleQuiz key={current._id} module={current} onResult={onQuizResult} />}
              </div>

              <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-4">
                <div className="text-[13px]">
                  {isDone ? (
                    <span className="inline-flex items-center gap-1.5 font-medium text-ok">
                      <Check size={15} /> Completed
                    </span>
                  ) : current.quiz?.length > 0 ? (
                    <span className="text-fg-muted">Pass the quiz to complete this module.</span>
                  ) : (
                    <Button variant="primary" onClick={markComplete} loading={completing}>
                      Mark as complete
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button icon={ChevronLeft} disabled={index === 0} onClick={() => goTo(modules[index - 1]._id)}>
                    Previous
                  </Button>
                  <Button disabled={index === modules.length - 1} onClick={() => goTo(modules[index + 1]._id)}>
                    Next <ChevronRight size={15} />
                  </Button>
                </div>
              </footer>
            </article>
          </div>
        ))}

      {tab === "assignments" && (
        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          {assignments.length === 0 ? (
            <EmptyState title="No assignments in this course" />
          ) : (
            <ul>
              {assignments.map((a) => {
                const state = assignmentState(a, a.mySubmission);
                return (
                  <li key={a._id} className="border-b border-line last:border-0">
                    <Link to={`/dashboard/assignments/${a._id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-subtle">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{a.title}</div>
                        <div className="text-[13px] text-fg-muted">
                          {dueLabel(a.deadline)} · {a.maximumMarks} marks
                        </div>
                      </div>
                      {state === "graded" ? (
                        <span className="tabular text-sm font-medium">
                          {a.mySubmission.marks}
                          <span className="text-fg-subtle">/{a.maximumMarks}</span>
                        </span>
                      ) : (
                        <StatusBadge status={state} />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {tab === "discussion" && <CourseDiscussion courseId={course._id} />}
      {tab === "notes" && <StudyNotes courseId={course._id} />}
    </>
  );
}
