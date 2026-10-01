import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, CalendarCheck } from "lucide-react";
import { dashboardApi } from "../../api/endpoints.js";
import { useAuth } from "../../context/AuthContext.jsx";
import useAsync from "../../lib/useAsync.js";
import { dueLabel, timeAgo, daysUntil } from "../../lib/format.js";
import { Button, EmptyState, ErrorState, PageHeader, PageLoader, Panel, ProgressBar, Stat, StatusBadge, cx } from "../../components/ui.jsx";

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

export default function StudentHome() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsync(async () => (await dashboardApi.student()).data, []);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const dueThisWeek = data.pendingAssignments.filter((a) => daysUntil(a.deadline) <= 7).length;
  const deadlines = [...data.overdueAssignments, ...data.pendingAssignments].slice(0, 6);

  if (data.enrolledCount === 0) {
    return (
      <>
        <PageHeader title={`${greeting()}, ${user.name.split(" ")[0]}`} />
        <div className="rounded-lg border border-line bg-surface">
          <EmptyState
            icon={BookOpen}
            title="You haven't joined a course yet"
            description="Pick a course from the catalog. Your modules, deadlines and grades will show up here."
            action={
              <Button to="/dashboard/catalog" variant="primary">
                Browse the catalog
              </Button>
            }
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${user.name.split(" ")[0]}`}
        description={new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Active courses" value={data.enrolledCount - data.completedCount} hint={`${data.completedCount} completed`} to="/dashboard/courses" />
        <Stat label="Average progress" value={`${data.overallProgress}%`} hint="across all courses" to="/dashboard/progress" />
        <Stat label="Due in the next 7 days" value={dueThisWeek} hint={`${data.pendingAssignments.length} open in total`} to="/dashboard/assignments" />
        <Stat
          label="Average grade"
          value={data.averageScore === null ? "—" : `${data.averageScore}%`}
          hint={
            data.overdueAssignments.length > 0 ? (
              <span className="text-danger">{data.overdueAssignments.length} overdue</span>
            ) : (
              "Nothing overdue"
            )
          }
          to="/dashboard/progress"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <Panel
          title="Continue learning"
          flush
          actions={
            <Button to="/dashboard/courses" variant="ghost" size="sm">
              All courses
            </Button>
          }
        >
          {data.nextModules.length === 0 ? (
            <EmptyState title="Nothing in progress" description="You've finished every module in your courses." />
          ) : (
            <ul>
              {data.nextModules.map((n) => (
                <li key={n.courseId} className="border-b border-line last:border-0">
                  <Link to={`/dashboard/courses/${n.courseId}/learn`} className="group flex items-center gap-4 px-5 py-3.5 hover:bg-subtle">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{n.courseTitle}</div>
                      <div className="mt-0.5 truncate text-[13px] text-fg-muted">
                        Next: Module {n.moduleOrder} · {n.moduleTitle}
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <ProgressBar value={n.progress} size="sm" className="max-w-[220px]" />
                        <span className="tabular text-xs text-fg-muted">{n.progress}%</span>
                      </div>
                    </div>
                    <ArrowRight size={16} className="shrink-0 text-fg-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-fg" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Deadlines"
          flush
          actions={
            <Button to="/dashboard/assignments" variant="ghost" size="sm">
              All assignments
            </Button>
          }
        >
          {deadlines.length === 0 ? (
            <EmptyState icon={CalendarCheck} title="Nothing due" description="You've submitted everything that's been set." />
          ) : (
            <ul>
              {deadlines.map((a) => {
                const overdue = new Date(a.deadline) < new Date();
                return (
                  <li key={a._id} className="border-b border-line last:border-0">
                    <Link to={`/dashboard/assignments/${a._id}`} className="flex items-start justify-between gap-3 px-5 py-3 hover:bg-subtle">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{a.title}</div>
                        <div className="truncate text-[13px] text-fg-muted">{a.course?.title}</div>
                      </div>
                      <span className={cx("shrink-0 pt-px text-xs", overdue ? "font-medium text-danger" : daysUntil(a.deadline) <= 2 ? "font-medium text-warn" : "text-fg-muted")}>
                        {dueLabel(a.deadline)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Recent submissions" flush className="mt-6">
        {data.recentActivity.length === 0 ? (
          <EmptyState title="No submissions yet" description="Work you hand in will be listed here with its grade." />
        ) : (
          <ul>
            {data.recentActivity.map((s) => (
              <li key={s._id} className="border-b border-line last:border-0">
                <Link to={`/dashboard/assignments/${s.assignment._id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-subtle">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{s.assignment.title}</div>
                    <div className="truncate text-[13px] text-fg-muted">
                      {s.assignment.course?.title} · submitted {timeAgo(s.submissionDate)}
                    </div>
                  </div>
                  {s.status === "graded" ? (
                    <span className="tabular shrink-0 text-sm font-medium">
                      {s.marks}
                      <span className="text-fg-subtle">/{s.assignment.maximumMarks}</span>
                    </span>
                  ) : (
                    <StatusBadge status={s.status} />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
