import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Users, BookOpen, ClipboardList, FileCheck, AlertCircle, Layers } from "lucide-react";
import { adminApi } from "../../api/endpoints.js";
import { Card, Spinner } from "../../components/ui.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";

const PIE_COLORS = ["var(--color-pine)", "var(--color-amber)", "var(--color-clay)"];

const StatCard = ({ icon: Icon, label, value }) => (
  <Card className="flex items-center gap-4">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-pine/10 text-pine dark:bg-pine-light/15 dark:text-pine-light">
      <Icon size={18} />
    </div>
    <div>
      <p className="text-xl font-semibold text-ink dark:text-dark-ink">{value}</p>
      <p className="text-xs text-ink-soft dark:text-dark-ink-soft">{label}</p>
    </div>
  </Card>
);

const AdminDashboard = () => {
  const { dark } = useTheme();
  const [stats, setStats] = useState(null);
  const [enrollByCourse, setEnrollByCourse] = useState([]);
  const [avgProgress, setAvgProgress] = useState([]);
  const [signups, setSignups] = useState([]);
  const [statusBreakdown, setStatusBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.stats(),
      adminApi.enrollmentsByCourse(),
      adminApi.avgProgressByCourse(),
      adminApi.signupsOverTime(),
      adminApi.submissionStatusBreakdown(),
    ]).then(([s, e, p, su, st]) => {
      setStats(s.data);
      setEnrollByCourse(e.data.data);
      setAvgProgress(p.data.data);
      setSignups(su.data.data);
      setStatusBreakdown(st.data.data);
      setLoading(false);
    });
  }, []);

  const gridColor = dark ? "#262d36" : "#e1ddd3";
  const textColor = dark ? "#9aa3ad" : "#4b5568";

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink dark:text-dark-ink">Admin Dashboard</h1>
      <p className="mt-1 text-sm text-ink-soft dark:text-dark-ink-soft">Platform overview and analytics.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={Users} label="Students" value={stats.studentCount} />
        <StatCard icon={BookOpen} label="Courses" value={stats.courseCount} />
        <StatCard icon={Layers} label="Enrollments" value={stats.enrollmentCount} />
        <StatCard icon={ClipboardList} label="Assignments" value={stats.assignmentCount} />
        <StatCard icon={FileCheck} label="Submissions" value={stats.submissionCount} />
        <StatCard icon={AlertCircle} label="Pending grading" value={stats.pendingGrading} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-base font-semibold text-ink dark:text-dark-ink">Enrollments by course</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={enrollByCourse} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="courseTitle"
                  tick={{ fontSize: 11, fill: textColor }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                />
                <YAxis tick={{ fontSize: 11, fill: textColor }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="count" fill="var(--color-pine)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-base font-semibold text-ink dark:text-dark-ink">
            Average progress by course (%)
          </h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={avgProgress} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="courseTitle"
                  tick={{ fontSize: 11, fill: textColor }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                />
                <YAxis tick={{ fontSize: 11, fill: textColor }} domain={[0, 100]} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="avgProgress" fill="var(--color-amber)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-base font-semibold text-ink dark:text-dark-ink">
            Student signups (last 30 days)
          </h2>
          <div className="mt-4 h-64">
            {signups.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-ink-soft dark:text-dark-ink-soft">
                No signups in this window yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={signups} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: textColor }} />
                  <YAxis tick={{ fontSize: 11, fill: textColor }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Line type="monotone" dataKey="count" stroke="var(--color-pine)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-base font-semibold text-ink dark:text-dark-ink">Submission status</h2>
          <div className="mt-4 h-64">
            {statusBreakdown.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-ink-soft dark:text-dark-ink-soft">
                No submissions yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusBreakdown} dataKey="count" nameKey="status" outerRadius={80} label>
                    {statusBreakdown.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
