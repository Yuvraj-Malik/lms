import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { dashboardApi } from "../../api/endpoints.js";
import { Card, Badge, Spinner, EmptyState } from "../../components/ui.jsx";
import ProgressBar from "../../components/ProgressBar.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const toneClasses = {
  pine: "bg-pine/10 text-pine dark:bg-pine-light/15 dark:text-pine-light",
  amber: "bg-amber/15 text-amber-dark dark:bg-amber/20 dark:text-amber-light",
  clay: "bg-clay/10 text-clay",
};

const StatCard = ({ icon: Icon, label, value, tone = "pine" }) => (
  <Card className="flex items-center gap-4">
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${toneClasses[tone]}`}>
      <Icon size={18} />
    </div>
    <div>
      <p className="text-xl font-semibold text-ink dark:text-dark-ink">{value}</p>
      <p className="text-xs text-ink-soft dark:text-dark-ink-soft">{label}</p>
    </div>
  </Card>
);

const StudentDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    dashboardApi.student().then(({ data }) => setData(data));
  }, []);

  if (!data) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink dark:text-dark-ink">
        Welcome back, {user.name.split(" ")[0]}
      </h1>
      <p className="mt-1 text-sm text-ink-soft dark:text-dark-ink-soft">Here's where things stand.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={BookOpen} label="Enrolled courses" value={data.enrolledCount} />
        <StatCard icon={CheckCircle2} label="Completed courses" value={data.completedCount} />
        <StatCard icon={Clock} label="Pending assignments" value={data.pendingAssignments.length} tone="amber" />
        <StatCard icon={AlertTriangle} label="Overdue" value={data.overdueAssignments.length} tone="clay" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-base font-semibold text-ink dark:text-dark-ink">Overall progress</h2>
          <ProgressBar value={data.overallProgress} className="mt-4" />

          <h3 className="mt-6 text-sm font-medium text-ink dark:text-dark-ink">Enrolled courses</h3>
          <div className="mt-2 space-y-3">
            {data.enrollments.slice(0, 4).map((e) => (
              <Link key={e._id} to={`/dashboard/my-courses/${e.course._id}`} className="block">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink dark:text-dark-ink">{e.course.title}</span>
                  <span className="text-ink-soft dark:text-dark-ink-soft">{e.progress}%</span>
                </div>
                <ProgressBar value={e.progress} showLabel={false} className="mt-1" />
              </Link>
            ))}
            {data.enrollments.length === 0 && (
              <EmptyState
                title="No courses yet"
                description="Browse the catalog and enroll in your first course."
                action={
                  <Link to="/courses" className="text-sm font-medium text-pine dark:text-amber-light">
                    Browse courses →
                  </Link>
                }
              />
            )}
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-base font-semibold text-ink dark:text-dark-ink">Upcoming assignments</h2>
          <div className="mt-4 space-y-2">
            {data.pendingAssignments.map((a) => (
              <Link
                key={a._id}
                to={`/dashboard/assignments/${a._id}`}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm hover:border-pine dark:border-dark-border"
              >
                <div>
                  <p className="font-medium text-ink dark:text-dark-ink">{a.title}</p>
                  <p className="text-xs text-ink-soft dark:text-dark-ink-soft">{a.course?.title}</p>
                </div>
                <Badge tone="amber">Due {new Date(a.deadline).toLocaleDateString()}</Badge>
              </Link>
            ))}
            {data.pendingAssignments.length === 0 && (
              <p className="text-sm text-ink-soft dark:text-dark-ink-soft">Nothing pending — you're caught up.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
