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

// Semantic status chart colors
const PIE_COLORS = ["#22C55E", "#F59E0B", "#EF4444", "#3B82F6"];

const StatCard = ({ icon: Icon, label, value, tone = "primary" }) => {
  const toneMap = {
    primary: "border-primary-500/20 bg-primary-50 text-primary-600 dark:bg-primary-600/15 dark:text-primary-400",
    success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    warning: "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    danger: "border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  };

  return (
    <Card className="flex items-center gap-4 p-6">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] border ${toneMap[tone] || toneMap.primary}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="type-h2 text-text-primary">{value}</p>
        <p className="type-body-sm text-text-secondary">{label}</p>
      </div>
    </Card>
  );
};

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

  const gridColor = dark ? "#242938" : "#E2E8F0";
  const textColor = dark ? "#9CA3AF" : "#64748B";
  const tooltipStyle = {
    fontSize: 12,
    borderRadius: 6,
    backgroundColor: dark ? "#1A1F2B" : "#FFFFFF",
    borderColor: dark ? "#242938" : "#E2E8F0",
    color: dark ? "#F1F3F7" : "#0F172A",
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div>
        <h1 className="type-display text-text-primary">Administrative Overview</h1>
        <p className="mt-1 type-body text-text-secondary">Platform enrollments, student progress, and submission metrics</p>
      </div>

      {/* Stat row (16px gap, 24px padding) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={Users} label="Total students" value={stats.studentCount} tone="primary" />
        <StatCard icon={BookOpen} label="Published courses" value={stats.courseCount} tone="primary" />
        <StatCard icon={Layers} label="Active enrollments" value={stats.enrollmentCount} tone="primary" />
        <StatCard icon={ClipboardList} label="Total assignments" value={stats.assignmentCount} tone="warning" />
        <StatCard icon={FileCheck} label="Submissions recorded" value={stats.submissionCount} tone="success" />
        <StatCard icon={AlertCircle} label="Awaiting evaluation" value={stats.pendingGrading} tone="danger" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="type-h3 text-text-primary mb-4">Course Enrollments</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={enrollByCourse} margin={{ left: -20, bottom: 20 }}>
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
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="type-h3 text-text-primary mb-4">
            Average Curriculum Progress (%)
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={avgProgress} margin={{ left: -20, bottom: 20 }}>
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
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="avgProgress" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="type-h3 text-text-primary mb-4">
            Student Registrations (30 Days)
          </h2>
          <div className="h-64">
            {signups.length === 0 ? (
              <p className="flex h-full items-center justify-center type-body-sm text-text-tertiary">
                No new registrations in this window.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={signups} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: textColor }} />
                  <YAxis tick={{ fontSize: 11, fill: textColor }} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="count" stroke="#4F46E5" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="type-h3 text-text-primary mb-4">Submission Evaluation Breakdown</h2>
          <div className="h-64">
            {statusBreakdown.length === 0 ? (
              <p className="flex h-full items-center justify-center type-body-sm text-text-tertiary">
                No submissions on record.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusBreakdown} dataKey="count" nameKey="status" outerRadius={80} label>
                    {statusBreakdown.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
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
