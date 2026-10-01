import { Link } from "react-router-dom";
import { Inbox } from "lucide-react";
import { adminApi } from "../../api/endpoints.js";
import { useAuth } from "../../context/AuthContext.jsx";
import useAsync from "../../lib/useAsync.js";
import { dueLabel, timeAgo, fmtDate } from "../../lib/format.js";
import { Button, EmptyState, ErrorState, PageHeader, PageLoader, Panel, ProgressBar, Stat, cx } from "../../components/ui.jsx";

// 30 daily columns of new enrollments. Single series, so no legend: the panel title names it.
const EnrollmentTrend = ({ points }) => {
  const days = [];
  const map = Object.fromEntries(points.map((p) => [p.date, p.count]));
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    days.push({ key, date: d, count: map[key] || 0 });
  }
  const max = Math.max(1, ...days.map((d) => d.count));
  const total = days.reduce((s, d) => s + d.count, 0);
  return (
    <div>
      <div className="tabular text-2xl font-semibold">{total}</div>
      <div className="text-[13px] text-fg-muted">new enrollments in the last 30 days</div>
      <div className="mt-5 flex h-28 items-end gap-[3px]" role="img" aria-label={`New enrollments per day, last 30 days. Total ${total}.`}>
        {days.map((d) => (
          <div key={d.key} className="group relative flex h-full flex-1 items-end">
            <div className={cx("w-full rounded-t-[3px]", d.count ? "bg-accent" : "bg-muted")} style={{ height: d.count ? `${Math.max(8, (d.count / max) * 100)}%` : "3px" }} />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded bg-fg px-2 py-1 text-xs text-bg group-hover:block">
              {fmtDate(d.date, { year: undefined })}: {d.count}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-fg-subtle">
        <span>{fmtDate(days[0].date, { year: undefined })}</span>
        <span>Today</span>
      </div>
    </div>
  );
};

const STATUS_META = [
  ["submitted", "Awaiting grade", "bg-info"],
  ["late", "Late, awaiting grade", "bg-warn"],
  ["graded", "Graded", "bg-ok"],
];

const SubmissionBreakdown = ({ rows }) => {
  const counts = Object.fromEntries(rows.map((r) => [r.status, r.count]));
  const total = rows.reduce((s, r) => s + r.count, 0);
  if (!total) return <p className="text-[13px] text-fg-muted">No submissions yet.</p>;
  return (
    <div>
      <div className="flex h-2.5 gap-[2px] overflow-hidden rounded-full">
        {STATUS_META.map(([k, , color]) => (counts[k] ? <div key={k} className={color} style={{ width: `${(counts[k] / total) * 100}%` }} /> : null))}
      </div>
      <ul className="mt-4 space-y-2 text-[13px]">
        {STATUS_META.map(([k, label, color]) => (
          <li key={k} className="flex items-center gap-2">
            <span className={cx("h-2 w-2 rounded-sm", color)} />
            <span className="flex-1 text-fg-muted">{label}</span>
            <span className="tabular font-medium">{counts[k] || 0}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default function AdminOverview() {
  const { isSuper } = useAuth();
  const { data, loading, error, reload } = useAsync(async () => (await adminApi.overview()).data, []);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const { stats } = data;

  return (
    <>
      <PageHeader
        title="Overview"
        description={isSuper ? "Platform-wide numbers across every course and user." : `Numbers for the ${stats.courseCount} course${stats.courseCount === 1 ? "" : "s"} you teach.`}
        actions={
          <Button to="/admin/courses/new" variant="primary">
            New course
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Students" value={stats.studentCount} hint={isSuper ? `${stats.userCount} users · ${stats.adminCount} admins` : "enrolled in your courses"} to="/admin/students" />
        <Stat label="Courses" value={stats.courseCount} hint={`${stats.publishedCount} published`} to="/admin/courses" />
        <Stat label="Completion rate" value={`${stats.completionRate}%`} hint={`of ${stats.enrollmentCount} enrollments`} />
        <Stat
          label="Waiting to be graded"
          value={<span className={cx(stats.pendingGrading > 0 && "text-warn")}>{stats.pendingGrading}</span>}
          hint={`${stats.submissionCount} submissions in total`}
          to="/admin/submissions"
        />
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel
          title="Grading queue"
          description="Oldest first"
          flush
          actions={
            <Button to="/admin/submissions" variant="ghost" size="sm">
              Open queue
            </Button>
          }
        >
          {data.gradingQueue.length === 0 ? (
            <EmptyState icon={Inbox} title="Nothing to grade" description="New submissions will appear here." />
          ) : (
            <ul>
              {data.gradingQueue.map((s) => (
                <li key={s._id} className="border-b border-line last:border-0">
                  <Link to={`/admin/submissions?open=${s._id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-subtle">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{s.assignment.title}</div>
                      <div className="truncate text-[13px] text-fg-muted">
                        {s.student.name} · {s.assignment.course?.title}
                      </div>
                    </div>
                    <span className={cx("shrink-0 text-xs", s.status === "late" ? "text-warn" : "text-fg-muted")}>
                      {s.status === "late" ? "Late · " : ""}
                      {timeAgo(s.submissionDate)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Submissions">
          <SubmissionBreakdown rows={data.submissionStatus} />
        </Panel>
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Courses by enrollment" description="Learners and their average progress" flush>
          {data.enrollmentsByCourse.length === 0 ? (
            <EmptyState title="No enrollments yet" />
          ) : (
            <ul>
              {data.enrollmentsByCourse.map((c) => (
                <li key={c.courseId} className="border-b border-line last:border-0">
                  <Link to={`/admin/courses/${c.courseId}?tab=students`} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 px-5 py-3 hover:bg-subtle sm:grid-cols-[1fr_160px_64px]">
                    <span className="truncate text-sm">{c.title}</span>
                    <span className="tabular text-right text-[13px] text-fg-muted sm:order-last">{c.students}</span>
                    <span className="col-span-2 flex items-center gap-2 sm:col-span-1">
                      <ProgressBar value={c.avgProgress} size="sm" />
                      <span className="tabular w-9 shrink-0 text-right text-xs text-fg-muted">{c.avgProgress}%</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="Enrollments">
            <EnrollmentTrend points={data.enrollmentTrend} />
          </Panel>
          <Panel title="Upcoming deadlines" flush>
            {data.upcoming.length === 0 ? (
              <p className="px-5 py-5 text-[13px] text-fg-muted">No upcoming deadlines.</p>
            ) : (
              <ul>
                {data.upcoming.map((a) => (
                  <li key={a._id} className="border-b border-line last:border-0">
                    <Link to={`/admin/courses/${a.course?._id}?tab=assignments`} className="flex items-center justify-between gap-4 px-5 py-2.5 hover:bg-subtle">
                      <span className="min-w-0">
                        <span className="block truncate text-sm">{a.title}</span>
                        <span className="block truncate text-xs text-fg-muted">{a.course?.title}</span>
                      </span>
                      <span className="shrink-0 text-xs text-fg-muted">{dueLabel(a.deadline)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
