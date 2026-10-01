import { Link, useNavigate } from "react-router-dom";
import { CalendarClock, Inbox, Library } from "lucide-react";
import { adminApi } from "../../api/endpoints.js";
import { useAuth } from "../../context/AuthContext.jsx";
import useAsync from "../../lib/useAsync.js";
import { dueLabel, fmtDate, timeAgo, plural } from "../../lib/format.js";
import { Badge, Button, EmptyState, ErrorState, PageHeader, PageLoader, Panel, ProgressBar, Stat, StatusBadge, Table, Td, Th, cx } from "../../components/ui.jsx";

/* ── Small, single-series charts (no legend needed: the label names the series) ── */

const DailyBars = ({ points, label }) => {
  const map = Object.fromEntries(points.map((p) => [p.date, p.count]));
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86400000);
    const key = d.toISOString().slice(0, 10);
    return { key, date: d, count: map[key] || 0 };
  });
  const max = Math.max(1, ...days.map((d) => d.count));
  const total = days.reduce((s, d) => s + d.count, 0);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] text-fg-muted">{label}</span>
        <span className="tabular text-sm font-semibold">{total}</span>
      </div>
      <div className="mt-2 flex h-12 items-end gap-[2px]" role="img" aria-label={`${label}: ${total} in the last 30 days`}>
        {days.map((d) => (
          <div key={d.key} className="group relative flex h-full flex-1 items-end">
            <div className={cx("w-full rounded-t-[2px]", d.count ? "bg-accent" : "bg-muted")} style={{ height: d.count ? `${Math.max(12, (d.count / max) * 100)}%` : "2px" }} />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-fg px-1.5 py-0.5 text-[11px] text-bg group-hover:block">
              {fmtDate(d.date, { year: undefined })}: {d.count}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-fg-subtle">
        <span>30 days ago</span>
        <span>Today</span>
      </div>
    </div>
  );
};

const STATUS_META = [
  ["submitted", "Awaiting grade", "bg-info"],
  ["late", "Late", "bg-warn"],
  ["graded", "Graded", "bg-ok"],
];

const SubmissionMix = ({ rows }) => {
  const counts = Object.fromEntries(rows.map((r) => [r.status, r.count]));
  const total = rows.reduce((s, r) => s + r.count, 0);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] text-fg-muted">Submissions</span>
        <span className="tabular text-sm font-semibold">{total}</span>
      </div>
      <div className="mt-2 flex h-2 gap-[2px] overflow-hidden rounded-full bg-muted">
        {total > 0 && STATUS_META.map(([k, , color]) => (counts[k] ? <div key={k} className={color} style={{ width: `${(counts[k] / total) * 100}%` }} /> : null))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {STATUS_META.map(([k, label, color]) => (
          <span key={k} className="inline-flex items-center gap-1.5 text-fg-muted">
            <span className={cx("h-2 w-2 rounded-sm", color)} />
            {label} <span className="tabular font-medium text-fg">{counts[k] || 0}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

const ListRow = ({ to, title, sub, right, rightClass }) => (
  <li className="border-b border-line last:border-0">
    <Link to={to} className="flex items-center gap-3 px-5 py-2.5 hover:bg-subtle">
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm">{title}</span>
        <span className="block truncate text-xs text-fg-muted">{sub}</span>
      </span>
      <span className={cx("shrink-0 text-xs", rightClass || "text-fg-muted")}>{right}</span>
    </Link>
  </li>
);

/* ── Page ── */

export default function AdminOverview() {
  const { isSuper } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAsync(async () => (await adminApi.overview()).data, []);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const { stats, courses } = data;

  return (
    <>
      <PageHeader
        title="Overview"
        description={isSuper ? "Everything happening across the platform." : `The ${plural(stats.courseCount, "course")} you teach, at a glance.`}
        actions={
          <>
            {isSuper && <Button to="/admin/platform">Platform settings</Button>}
            <Button to="/admin/courses/new" variant="primary">
              New course
            </Button>
          </>
        }
      />

      {/* Row 1 — headline numbers */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {isSuper ? (
          <Stat label="Users" value={data.users.total} hint={`${data.users.students} students · ${data.users.instructors + data.users.supers} staff`} to="/admin/users" />
        ) : (
          <Stat label="Students" value={stats.studentCount} hint="enrolled in your courses" to="/admin/students" />
        )}
        <Stat label="Courses" value={stats.courseCount} hint={`${stats.publishedCount} published · ${stats.courseCount - stats.publishedCount} draft`} to="/admin/courses" />
        <Stat label="Enrollments" value={stats.enrollmentCount} hint={`${stats.completionRate}% completed`} />
        <Stat
          label="To grade"
          value={<span className={cx(stats.pendingGrading > 0 && "text-warn")}>{stats.pendingGrading}</span>}
          hint={`of ${plural(stats.submissionCount, "submission")}`}
          to="/admin/submissions"
        />
      </div>

      {/* Row 2 — every course, including ones nobody has joined yet */}
      <Panel
        className="mt-6"
        title={isSuper ? "All courses" : "Your courses"}
        flush
        actions={
          <Button to="/admin/courses" variant="ghost" size="sm">
            Manage courses
          </Button>
        }
      >
        {courses.length === 0 ? (
          <EmptyState
            icon={Library}
            title="No courses yet"
            description="Create a course, then add modules, quizzes and assignments."
            action={
              <Button to="/admin/courses/new" variant="primary">
                Create a course
              </Button>
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Course</Th>
                {isSuper && <Th className="hidden xl:table-cell">Owner</Th>}
                <Th>Status</Th>
                <Th align="right">Learners</Th>
                <Th className="hidden w-[18%] md:table-cell">Avg. progress</Th>
                <Th align="right" className="hidden sm:table-cell">To grade</Th>
                <Th className="hidden lg:table-cell">Next deadline</Th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c._id} onClick={() => navigate(`/admin/courses/${c._id}`)} className="cursor-pointer hover:bg-subtle">
                  <Td>
                    <div className="font-medium">{c.title}</div>
                    <div className="text-xs text-fg-muted">
                      {c.category} · {plural(c.modules, "module")}
                    </div>
                  </Td>
                  {isSuper && <Td className="hidden text-fg-muted xl:table-cell">{c.owner?.name || "—"}</Td>}
                  <Td>
                    <StatusBadge status={c.isPublished ? "published" : "draft"} />
                  </Td>
                  <Td align="right" className="tabular">
                    {c.students}
                    {c.completed > 0 && <div className="text-xs text-fg-muted">{c.completed} done</div>}
                  </Td>
                  <Td className="hidden md:table-cell">
                    {c.students ? (
                      <div className="flex items-center gap-2.5">
                        <ProgressBar value={c.avgProgress} size="sm" />
                        <span className="tabular w-9 shrink-0 text-right text-xs text-fg-muted">{c.avgProgress}%</span>
                      </div>
                    ) : (
                      <span className="text-xs text-fg-subtle">No learners yet</span>
                    )}
                  </Td>
                  <Td align="right" className="tabular hidden sm:table-cell">
                    {c.pendingGrading ? <span className="font-medium text-warn">{c.pendingGrading}</span> : <span className="text-fg-subtle">0</span>}
                  </Td>
                  <Td className="hidden whitespace-nowrap text-fg-muted lg:table-cell">{c.nextDeadline ? dueLabel(c.nextDeadline) : <span className="text-fg-subtle">—</span>}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>

      {/* Row 3 — three equal work panels */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel
          title="Grading queue"
          flush
          actions={
            <Button to="/admin/submissions" variant="ghost" size="sm">
              Open
            </Button>
          }
        >
          {data.gradingQueue.length === 0 ? (
            <EmptyState icon={Inbox} title="Nothing to grade" description="New submissions appear here, oldest first." />
          ) : (
            <ul>
              {data.gradingQueue.slice(0, 5).map((s) => (
                <ListRow
                  key={s._id}
                  to={`/admin/submissions?open=${s._id}`}
                  title={s.assignment.title}
                  sub={`${s.student.name} · ${s.assignment.course?.title}`}
                  right={`${s.status === "late" ? "Late · " : ""}${timeAgo(s.submissionDate)}`}
                  rightClass={s.status === "late" ? "text-warn" : undefined}
                />
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Upcoming deadlines" flush>
          {data.upcoming.length === 0 ? (
            <EmptyState icon={CalendarClock} title="No upcoming deadlines" description="Assignments you post will show here." />
          ) : (
            <ul>
              {data.upcoming.slice(0, 5).map((a) => (
                <ListRow key={a._id} to={`/admin/courses/${a.course?._id}?tab=assignments`} title={a.title} sub={a.course?.title} right={dueLabel(a.deadline)} />
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Activity" description="Last 30 days" bodyClassName="space-y-6">
          <DailyBars points={data.enrollmentTrend} label="New enrollments" />
          {isSuper && <DailyBars points={data.signupTrend} label="New accounts" />}
          <SubmissionMix rows={data.submissionStatus} />
        </Panel>
      </div>

      {/* Row 4 — super admin: staff and audit trail */}
      {isSuper && (
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Panel
            className="lg:col-span-2"
            title="Instructors"
            flush
            actions={
              <Button to="/admin/users?role=admin" variant="ghost" size="sm">
                Manage staff
              </Button>
            }
          >
            <Table>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th align="right">Courses</Th>
                  <Th align="right">Learners</Th>
                  <Th align="right">To grade</Th>
                  <Th className="hidden md:table-cell">Last active</Th>
                </tr>
              </thead>
              <tbody>
                {data.instructors.map((i) => (
                  <tr key={i._id}>
                    <Td>
                      <div className="flex items-center gap-2 font-medium">
                        {i.name}
                        {i.isSuperAdmin && <Badge tone="accent">Super admin</Badge>}
                        {!i.isActive && <Badge tone="danger">Deactivated</Badge>}
                      </div>
                      <div className="text-xs text-fg-muted">{i.email}</div>
                    </Td>
                    <Td align="right" className="tabular">
                      {i.courses}
                      {i.courses > i.published && <div className="text-xs text-fg-muted">{i.courses - i.published} draft</div>}
                    </Td>
                    <Td align="right" className="tabular">{i.students}</Td>
                    <Td align="right" className={cx("tabular", i.pendingGrading > 0 ? "text-warn" : "text-fg-subtle")}>{i.pendingGrading}</Td>
                    <Td className="hidden whitespace-nowrap text-fg-muted md:table-cell">{timeAgo(i.lastLogin)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Panel>

          <Panel
            title="Recent admin activity"
            flush
            actions={
              <Button to="/admin/activity" variant="ghost" size="sm">
                Full log
              </Button>
            }
          >
            {data.recentActivity.length === 0 ? (
              <EmptyState title="No admin actions yet" description="Changes made by instructors and admins are recorded here." />
            ) : (
              <ul>
                {data.recentActivity.map((e) => (
                  <li key={e._id} className="border-b border-line px-5 py-2.5 last:border-0">
                    <div className="text-[13px] leading-snug">{e.summary}</div>
                    <div className="mt-0.5 text-xs text-fg-muted">
                      {e.actorName} · {timeAgo(e.createdAt)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      )}
    </>
  );
}
