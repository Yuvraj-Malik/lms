import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ListChecks, FileText } from "lucide-react";
import { courseApi, enrollmentApi } from "../../api/endpoints.js";
import { getErrorMessage } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import useAsync from "../../lib/useAsync.js";
import { fmtDate, dueLabel, plural } from "../../lib/format.js";
import { CourseCover } from "../../components/CourseCard.jsx";
import { Badge, Button, ErrorState, PageHeader, PageLoader, Panel, ProgressBar, useFeedback } from "../../components/ui.jsx";

// Course landing page. Public visitors, students and instructors all see this,
// with the call-to-action changing to match who's looking.
export default function CourseOverview({ backTo, backLabel }) {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useFeedback();
  const [busy, setBusy] = useState(false);
  const { data, loading, error, reload } = useAsync(async () => (await courseApi.get(courseId)).data, [courseId, user?._id]);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const { course, modules, assignments, counts, access } = data;
  const learnPath = `/dashboard/courses/${course._id}/learn`;

  const enroll = async () => {
    if (!user) return navigate("/login", { state: { from: { pathname: `/dashboard/courses/${course._id}` } } });
    setBusy(true);
    try {
      await enrollmentApi.enroll(course._id);
      toast(`You're enrolled in ${course.title}.`);
      navigate(learnPath);
    } catch (err) {
      toast(getErrorMessage(err), "danger");
    } finally {
      setBusy(false);
    }
  };

  let action;
  if (access.canManage) {
    action = (
      <Button to={`/admin/courses/${course._id}`} variant="primary" className="w-full">
        Manage this course
      </Button>
    );
  } else if (user?.role === "admin") {
    action = <p className="text-[13px] text-fg-muted">This course belongs to another instructor.</p>;
  } else if (access.enrolled) {
    action = (
      <>
        <div className="mb-3 flex items-center gap-3">
          <ProgressBar value={access.enrollment.progress} />
          <span className="tabular text-sm text-fg-muted">{access.enrollment.progress}%</span>
        </div>
        <Button to={learnPath} variant="primary" className="w-full">
          {access.enrollment.status === "completed" ? "Review course" : access.enrollment.progress ? "Continue learning" : "Start learning"}
        </Button>
      </>
    );
  } else {
    action = (
      <Button variant="primary" className="w-full" onClick={enroll} loading={busy}>
        {user ? "Enroll for free" : "Sign in to enroll"}
      </Button>
    );
  }

  return (
    <div>
      <PageHeader back={backTo ? { to: backTo, label: backLabel } : undefined} eyebrow={`${course.category} · ${course.difficulty}`} title={course.title}>
        {!course.isPublished && (
          <Badge tone="warn" className="mt-3">
            Draft — only you and the super admin can see this
          </Badge>
        )}
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <Panel title="About this course">
            <p className="prose-notes text-sm">{course.description}</p>
          </Panel>

          <Panel title="Syllabus" description={plural(counts.moduleCount, "module")} flush>
            {modules.length === 0 ? (
              <p className="px-5 py-6 text-[13px] text-fg-muted">The instructor hasn't published any modules yet.</p>
            ) : (
              <ol>
                {modules.map((m) => (
                  <li key={m._id} className="flex gap-4 border-b border-line px-5 py-3.5 last:border-0">
                    <span className="tabular w-6 shrink-0 pt-px text-[13px] text-fg-subtle">{String(m.moduleOrder).padStart(2, "0")}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-fg">{m.title}</div>
                      {m.description && <p className="mt-0.5 text-[13px] text-fg-muted">{m.description}</p>}
                    </div>
                    {m.quizCount > 0 && (
                      <span className="flex shrink-0 items-center gap-1 text-xs text-fg-muted">
                        <ListChecks size={13} /> Quiz
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          {assignments.length > 0 && (
            <Panel title="Assignments" flush>
              <ul>
                {assignments.map((a) => (
                  <li key={a._id} className="flex items-center gap-3 border-b border-line px-5 py-3 last:border-0">
                    <FileText size={15} className="shrink-0 text-fg-subtle" />
                    <span className="min-w-0 flex-1 truncate text-sm">{a.title}</span>
                    <span className="shrink-0 text-xs text-fg-muted">
                      {a.maximumMarks} marks · {access.enrolled ? dueLabel(a.deadline) : fmtDate(a.deadline)}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="overflow-hidden rounded-lg border border-line bg-surface">
            <CourseCover course={course} className="border-b border-line" />
            <div className="p-4">
              {action}
              <dl className="mt-4 space-y-2 text-[13px]">
                {[
                  ["Instructor", course.instructor],
                  ["Duration", course.duration],
                  ["Modules", counts.moduleCount],
                  ["Assignments", counts.assignmentCount],
                  ["Learners", counts.enrolledCount],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <dt className="text-fg-muted">{k}</dt>
                    <dd className="m-0 text-right text-fg">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
