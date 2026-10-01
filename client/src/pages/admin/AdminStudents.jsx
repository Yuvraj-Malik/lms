import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import { adminApi } from "../../api/endpoints.js";
import { useAuth } from "../../context/AuthContext.jsx";
import useAsync from "../../lib/useAsync.js";
import { timeAgo } from "../../lib/format.js";
import { Avatar, EmptyState, ErrorState, PageHeader, PageLoader, ProgressBar, SearchInput, StatusBadge, Table, Td, Th, cx } from "../../components/ui.jsx";

export default function AdminStudents() {
  const { isSuper } = useAuth();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);
  const { data, loading, error, reload } = useAsync(async () => (await adminApi.students({ search: query || undefined })).data.students, [query]);

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading && !data) return <PageLoader />;

  return (
    <>
      <PageHeader title="Students" description={isSuper ? "Every student account on the platform." : "Students enrolled in at least one of your courses."} />
      <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email" className="mb-4 sm:w-80" />
      <div className={cx("overflow-hidden rounded-lg border border-line bg-surface", loading && "opacity-60")}>
        {data.length === 0 ? (
          <EmptyState icon={Users} title={query ? "No students match" : "No students yet"} description={query ? undefined : "Students appear here once they enroll in your courses."} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Student</Th>
                <Th align="right">Courses</Th>
                <Th className="hidden w-[24%] md:table-cell">Average progress</Th>
                <Th className="hidden lg:table-cell">Last active</Th>
                <Th>Account</Th>
              </tr>
            </thead>
            <tbody>
              {data.map((s) => (
                <tr key={s._id} className="hover:bg-subtle">
                  <Td>
                    <Link to={`/admin/students/${s._id}`} className="flex items-center gap-2.5">
                      <Avatar user={s} size={28} />
                      <span className="min-w-0">
                        <span className="block truncate font-medium hover:underline">{s.name}</span>
                        <span className="block truncate text-xs text-fg-muted">{s.email}</span>
                      </span>
                    </Link>
                  </Td>
                  <Td align="right" className="tabular">
                    {s.courses}
                    {s.completed > 0 && <span className="text-xs text-fg-muted"> ({s.completed} done)</span>}
                  </Td>
                  <Td className="hidden md:table-cell">
                    {s.courses ? (
                      <div className="flex items-center gap-3">
                        <ProgressBar value={s.avgProgress} size="sm" />
                        <span className="tabular w-9 shrink-0 text-right text-xs text-fg-muted">{s.avgProgress}%</span>
                      </div>
                    ) : (
                      <span className="text-fg-subtle">—</span>
                    )}
                  </Td>
                  <Td className="hidden whitespace-nowrap text-fg-muted lg:table-cell">{timeAgo(s.lastLogin)}</Td>
                  <Td>
                    <StatusBadge status={s.isActive ? "enabled" : "deactivated"} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </>
  );
}
