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
  Code,
  Layers,
  Database,
  Cpu,
  Globe
} from "lucide-react";
import { dashboardApi } from "../../api/endpoints.js";
import { Card, Spinner, EmptyState, StatusBadge } from "../../components/ui.jsx";
import ProgressBar from "../../components/ProgressBar.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

// Fixed 3-value brand rotation for course cards / category markers
const BRAND_ROTATION = [
  "brand-rotation-0", // primary-600 (#4F46E5)
  "brand-rotation-1", // warm neutral (#8B7355)
  "brand-rotation-2", // slate neutral (#64748B)
];

const getCategoryIcon = (category = "") => {
  const cat = category.toLowerCase();
  if (cat.includes("code") || cat.includes("web") || cat.includes("dev")) return Code;
  if (cat.includes("data") || cat.includes("sql") || cat.includes("cloud")) return Database;
  if (cat.includes("system") || cat.includes("ai") || cat.includes("ml")) return Cpu;
  if (cat.includes("design") || cat.includes("ui") || cat.includes("ux")) return Layers;
  if (cat.includes("network") || cat.includes("security")) return Globe;
  return BookOpen;
};

const daysUntil = (deadline) => {
  const diffMs =
    new Date(deadline).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  return Math.round(diffMs / 86400000);
};

const StatCard = ({ icon: Icon, label, value, tone = "primary" }) => {
  const toneMap = {
    primary: "border-primary-500/20 bg-primary-50 text-primary-600 dark:bg-primary-600/15 dark:text-primary-400",
    success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    warning: "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    danger: "border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  };

  return (
    <Card className="flex items-center gap-4 p-6">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] border ${toneMap[tone] || toneMap.primary}`}
      >
        <Icon size={20} />
      </div>
      <div>
        <p className="type-h2 text-text-primary">
          {value}
        </p>
        <p className="type-body-sm text-text-secondary">{label}</p>
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
    <div className="space-y-12">
      {/* Page header */}
      <div>
        <h1 className="type-display text-text-primary">
          {greeting()}, {user.name.split(" ")[0]}
        </h1>
        <p className="mt-1 type-body text-text-secondary">
          Academic progress and assignment schedule
        </p>
      </div>

      {/* Stat row (16px gap, 24px card padding) */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={BookOpen} label="Enrolled courses" value={data.enrolledCount} tone="primary" />
        <StatCard icon={CheckCircle2} label="Completed courses" value={data.completedCount} tone="success" />
        <StatCard
          icon={Clock}
          label="Pending assignments"
          value={data.pendingAssignments.length}
          tone="warning"
        />
        <StatCard
          icon={AlertTriangle}
          label="Overdue assignments"
          value={data.overdueAssignments.length}
          tone="danger"
        />
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Course progress — wider */}
        <Card className="lg:col-span-3 p-0 overflow-hidden">
          <div className="border-b border-border-subtle p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <TrendingUp size={18} className="text-primary-600 dark:text-primary-400" />
                <h2 className="type-h3 text-text-primary">
                  Overall Curriculum Progress
                </h2>
              </div>
              <span className="rounded-[4px] border border-primary-500/20 bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700 dark:bg-primary-600/15 dark:text-primary-400">
                {data.overallProgress}%
              </span>
            </div>
            <ProgressBar value={data.overallProgress} showLabel={false} className="mt-4" />
          </div>

          <div className="divide-y divide-border-subtle">
            {data.enrollments.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={BookOpen}
                  title="No course enrollments"
                  description="Browse the academic catalog to enroll in your courses."
                  action={
                    <Link
                      to="/dashboard/my-courses"
                      className="inline-flex items-center gap-2 rounded-[6px] bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 shadow-sm"
                    >
                      Browse courses <ArrowRight size={14} />
                    </Link>
                  }
                />
              </div>
            ) : (
              data.enrollments.slice(0, 5).map((e, i) => {
                const CategoryIcon = getCategoryIcon(e.course.category);
                const rotationClass = BRAND_ROTATION[i % BRAND_ROTATION.length];

                return (
                  <Link
                    key={e._id}
                    to={`/dashboard/my-courses/${e.course._id}`}
                    className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-bg-surface-raised"
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] text-xs font-medium ${rotationClass}`}
                    >
                      <CategoryIcon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate type-h3 text-text-primary">
                        {e.course.title}
                      </p>
                      <ProgressBar
                        value={e.progress}
                        showLabel={false}
                        className="mt-2"
                      />
                    </div>
                    <span className="shrink-0 type-body-sm font-medium text-text-secondary">
                      {e.progress}%
                    </span>
                    <ChevronRight
                      size={15}
                      className="shrink-0 text-text-tertiary"
                    />
                  </Link>
                );
              })
            )}
          </div>

          {data.enrollments.length > 0 && (
            <div className="border-t border-border-subtle p-3.5 bg-bg-surface">
              <Link
                to="/dashboard/my-courses"
                className="flex items-center justify-center gap-2 rounded-[6px] py-1.5 type-body-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
              >
                View all courses <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </Card>

        {/* Upcoming assignments */}
        <Card className="lg:col-span-2 p-0 overflow-hidden">
          <div className="border-b border-border-subtle p-6">
            <div className="flex items-center gap-2.5">
              <CalendarClock size={18} className="text-amber-500" />
              <h2 className="type-h3 text-text-primary">
                Upcoming Deadlines
              </h2>
            </div>
          </div>

          <div className="divide-y divide-border-subtle">
            {data.pendingAssignments.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-14 text-center px-6">
                <CheckCircle2 size={28} className="text-emerald-500" />
                <p className="type-h3 text-text-primary">
                  All current assignments submitted
                </p>
                <p className="type-body-sm text-text-secondary">
                  No pending deadlines on your schedule.
                </p>
              </div>
            ) : (
              data.pendingAssignments.slice(0, 6).map((a) => {
                const days = daysUntil(a.deadline);
                const isOverdue = days < 0;
                const statusKey = isOverdue ? "overdue" : "upcoming";
                const labelText = isOverdue ? "Overdue" : days === 0 ? "Due today" : `Due in ${days}d`;

                return (
                  <Link
                    key={a._id}
                    to={`/dashboard/assignments/${a._id}`}
                    className="flex items-start justify-between gap-3 px-6 py-4 transition-colors hover:bg-bg-surface-raised"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate type-body font-medium text-text-primary">
                        {a.title}
                      </p>
                      <p className="truncate type-body-sm text-text-secondary mt-0.5">
                        {a.course?.title}
                      </p>
                    </div>
                    <div className="shrink-0 mt-0.5">
                      <StatusBadge status={statusKey} label={labelText} />
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          {data.pendingAssignments.length > 0 && (
            <div className="border-t border-border-subtle p-3.5 bg-bg-surface">
              <Link
                to="/dashboard/assignments"
                className="flex items-center justify-center gap-2 rounded-[6px] py-1.5 type-body-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
              >
                View assignment hub <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
