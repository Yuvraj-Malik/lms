import { Link } from "react-router-dom";
import { Award } from "lucide-react";
import { userApi } from "../../api/endpoints.js";
import useAsync from "../../lib/useAsync.js";
import { fmtDate } from "../../lib/format.js";
import { Avatar, Button, EmptyState, ErrorState, PageLoader, Panel, Stat } from "../../components/ui.jsx";

export default function Profile() {
  const { data, loading, error, reload } = useAsync(async () => (await userApi.profile()).data, []);
  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const { user, summary, certificates } = data;
  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar user={user} size={56} />
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight">{user.name}</h1>
            <p className="text-sm text-fg-muted">
              {user.email}
              {user.department ? ` · ${user.department}` : ""}
            </p>
          </div>
        </div>
        <Button to="/dashboard/settings">Edit profile</Button>
      </div>
      {user.bio && <p className="mb-6 max-w-2xl text-sm text-fg-muted">{user.bio}</p>}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Courses" value={summary.enrolled} hint={`${summary.completed} completed`} />
        <Stat label="Modules completed" value={summary.modulesCompleted} />
        <Stat label="Quizzes passed" value={summary.quizzesPassed} />
        <Stat label="Average grade" value={summary.averageScore === null ? "—" : `${summary.averageScore}%`} hint={`${summary.submissions} submissions`} />
      </div>

      <Panel title="Certificates" description="Awarded when you complete every module in a course." flush>
        {certificates.length === 0 ? (
          <EmptyState icon={Award} title="No certificates yet" description="Finish all modules in a course to earn one." />
        ) : (
          <ul>
            {certificates.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-4 border-b border-line px-5 py-3.5 last:border-0">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{c.courseTitle}</div>
                  <div className="text-[13px] text-fg-muted">
                    Issued {fmtDate(c.issueDate)} · <span className="font-mono text-xs">{c.id}</span>
                  </div>
                </div>
                <Link to={`/dashboard/certificates/${c.enrollmentId}`} className="text-sm font-medium text-accent-fg hover:underline">
                  View
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
