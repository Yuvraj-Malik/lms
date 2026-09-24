import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { dashboardApi } from "../../api/endpoints.js";
import { Card, Badge, Spinner, EmptyState, SectionHeader } from "../../components/ui.jsx";
import ProgressBar from "../../components/ProgressBar.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const ACCENT_COLORS = [
  "bg-pine",
  "bg-sky",
  "bg-[#7c3aed]",
  "bg-amber",
  "bg-clay",
  "bg-[#0f766e]",
];

const daysUntil = (deadline) => {
  const diffMs =
    new Date(deadline).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  return Math.round(diffMs / 86400000);
};

const StatCard = ({ icon: Icon, label, value, tone = "pine" }) => {
  const toneMap = {
    pine: "bg-pine-bg text-pine dark:bg-pine-light/10 dark:text-pine-lighter",
    amber: "bg-amber-bg text-amber dark:bg-amber/10 dark:text-amber-lighter",
    clay: "bg-clay-bg text-clay dark:bg-clay/10 dark:text-clay-light",
    sky: "bg-sky-bg text-sky dark:bg-sky/10 dark:text-sky",
  };
  return (
    <Card className="flex items-center gap-4 p-5">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${toneMap[tone]}`}
      >
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight text-ink dark:text-dark-ink">
          {value}
        </p>
        <p className="text-xs text-ink-soft dark:text-dark-ink-soft">{label}</p>
      </div>
    </Card>
  );
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    dashboardApi.student().then(({ data }) => setData(data));
  }, []);

  if (!data) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner size={28} />
      </div>
    );
  }

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-dark-ink">
          {greeting()}, {user.name.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-ink-soft dark:text-dark-ink-soft">
          Here's a snapshot of your learning activity.
        </p>
      </div>

      {/* Stat row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={BookOpen} label="Enrolled courses" value={data.enrolledCount} />
        <StatCard icon={CheckCircle2} label="Completed" value={data.completedCount} tone="pine" />
        <StatCard
          icon={Clock}
          label="Pending assignments"
          value={data.pendingAssignments.length}
          tone="amber"
        />
        <StatCard
          icon={AlertTriangle}
          label="Overdue"
          value={data.overdueAssignments.length}
          tone="clay"
        />
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Course progress — wider */}
        <Card className="lg:col-span-3">
          <div className="border-b border-border p-5 dark:border-dark-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-pine dark:text-pine-lighter" />
                <h2 className="text-sm font-semibold text-ink dark:text-dark-ink">
                  Overall Progress
                </h2>
              </div>
              <span className="rounded-full bg-pine-bg px-2.5 py-1 text-xs font-bold text-pine dark:bg-pine-lighter/10 dark:text-pine-lighter">
                {data.overallProgress}%
              </span>
            </div>
            <ProgressBar value={data.overallProgress} showLabel={false} className="mt-3" />
          </div>

          <div className="divide-y divide-border dark:divide-dark-border">
            {data.enrollments.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={BookOpen}
                  title="No courses yet"
                  description="Browse the catalog and enroll in your first course."
                  action={
                    <Link
                      to="/dashboard/my-courses"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-pine px-4 py-2 text-sm font-medium text-white hover:bg-pine-light dark:bg-pine-light dark:hover:bg-pine-lighter"
                    >
                      Browse courses <ArrowRight size={14} />
                    </Link>
                  }
                />
              </div>
            ) : (
              data.enrollments.slice(0, 5).map((e, i) => (
                <Link
                  key={e._id}
                  to={`/dashboard/my-courses/${e.course._id}`}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-surface-sunken dark:hover:bg-dark-surface-elevated"
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white ${ACCENT_COLORS[i % ACCENT_COLORS.length]}`}
                  >
                    {e.course.title[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink dark:text-dark-ink">
                      {e.course.title}
                    </p>
                    <ProgressBar
                      value={e.progress}
                      showLabel={false}
                      className="mt-1.5"
                    />
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-ink-soft dark:text-dark-ink-soft">
                    {e.progress}%
                  </span>
                  <ChevronRight
                    size={14}
                    className="shrink-0 text-ink-muted dark:text-dark-ink-muted"
                  />
                </Link>
              ))
            )}
          </div>

          {data.enrollments.length > 0 && (
            <div className="border-t border-border p-3 dark:border-dark-border">
              <Link
                to="/dashboard/my-courses"
                className="flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium text-ink-soft transition-colors hover:text-ink dark:text-dark-ink-soft dark:hover:text-dark-ink"
              >
                View all courses <ArrowRight size={12} />
              </Link>
            </div>
          )}
        </Card>

        {/* Upcoming assignments */}
        <Card className="lg:col-span-2">
          <div className="border-b border-border p-5 dark:border-dark-border">
            <div className="flex items-center gap-2">
              <CalendarClock size={16} className="text-amber dark:text-amber-lighter" />
              <h2 className="text-sm font-semibold text-ink dark:text-dark-ink">
                Upcoming Assignments
              </h2>
            </div>
          </div>

          <div className="divide-y divide-border dark:divide-dark-border">
            {data.pendingAssignments.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <CheckCircle2 size={28} className="text-pine dark:text-pine-lighter" />
                <p className="text-sm font-medium text-ink dark:text-dark-ink">
                  All caught up!
                </p>
                <p className="text-xs text-ink-soft dark:text-dark-ink-soft">
                  No pending assignments.
                </p>
              </div>
            ) : (
              data.pendingAssignments.slice(0, 6).map((a) => {
                const days = daysUntil(a.deadline);
                const urgent = days <= 2;
                return (
                  <Link
                    key={a._id}
                    to={`/dashboard/assignments/${a._id}`}
                    className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-surface-sunken dark:hover:bg-dark-surface-elevated"
                  >
                    <div
                      className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                        urgent ? "bg-clay" : "bg-amber"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink dark:text-dark-ink">
                        {a.title}
                      </p>
                      <p className="truncate text-xs text-ink-soft dark:text-dark-ink-soft">
                        {a.course?.title}
                      </p>
                    </div>
                    <Badge tone={urgent ? "clay" : "amber"} size="xs" className="shrink-0 mt-0.5">
                      {days < 0
                        ? "Overdue"
                        : days === 0
                        ? "Today"
                        : `${days}d`}
                    </Badge>
                  </Link>
                );
              })
            )}
          </div>

          {data.pendingAssignments.length > 0 && (
            <div className="border-t border-border p-3 dark:border-dark-border">
              <Link
                to="/dashboard/assignments"
                className="flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium text-ink-soft transition-colors hover:text-ink dark:text-dark-ink-soft dark:hover:text-dark-ink"
              >
                View all assignments <ArrowRight size={12} />
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
