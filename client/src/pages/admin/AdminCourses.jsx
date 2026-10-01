import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { courseApi } from "../../api/endpoints.js";
import { useAuth } from "../../context/AuthContext.jsx";
import useAsync from "../../lib/useAsync.js";
import { timeAgo } from "../../lib/format.js";
import { Button, EmptyState, ErrorState, PageHeader, PageLoader, SearchInput, Segmented, StatusBadge, Table, Td, Th } from "../../components/ui.jsx";

export default function AdminCourses() {
  const { user, isSuper } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [owner, setOwner] = useState("all");
  const { data, loading, error, reload } = useAsync(async () => (await courseApi.manage()).data.courses, []);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data || []).filter(
      (c) =>
        (!q || `${c.title} ${c.category} ${c.instructor}`.toLowerCase().includes(q)) &&
        (status === "all" || (status === "published") === c.isPublished) &&
        (owner === "all" || (owner === "mine") === (c.createdBy?._id === user._id))
    );
  }, [data, search, status, owner, user._id]);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <>
      <PageHeader
        title="Courses"
        description={isSuper ? "Every course on the platform. As super admin you can edit any of them." : "Courses you created. Only you and the super admin can edit them."}
        actions={
          <Button to="/admin/courses/new" variant="primary">
            New course
          </Button>
        }
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search courses" className="sm:w-72" />
        <Segmented
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "All" },
            { value: "published", label: "Published" },
            { value: "draft", label: "Drafts" },
          ]}
        />
        {isSuper && (
          <Segmented
            value={owner}
            onChange={setOwner}
            options={[
              { value: "all", label: "Any owner" },
              { value: "mine", label: "Mine" },
              { value: "others", label: "Other instructors" },
            ]}
          />
        )}
      </div>
      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        {data.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="You haven't created a course yet"
            description="Start with the basics. You can add modules, quizzes and assignments once it exists."
            action={
              <Button to="/admin/courses/new" variant="primary">
                Create your first course
              </Button>
            }
          />
        ) : rows.length === 0 ? (
          <EmptyState title="No courses match these filters" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Course</Th>
                <Th>Status</Th>
                {isSuper && <Th className="hidden lg:table-cell">Owner</Th>}
                <Th align="right" className="hidden sm:table-cell">Modules</Th>
                <Th align="right" className="hidden sm:table-cell">Assignments</Th>
                <Th align="right">Learners</Th>
                <Th className="hidden md:table-cell">Updated</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c._id} className="hover:bg-subtle">
                  <Td>
                    <Link to={`/admin/courses/${c._id}`} className="font-medium hover:underline hover:underline-offset-4">
                      {c.title}
                    </Link>
                    <div className="text-xs text-fg-muted">
                      {c.category} · {c.difficulty}
                    </div>
                  </Td>
                  <Td>
                    <StatusBadge status={c.isPublished ? "published" : "draft"} />
                  </Td>
                  {isSuper && <Td className="hidden text-fg-muted lg:table-cell">{c.createdBy?._id === user._id ? "You" : c.createdBy?.name || "—"}</Td>}
                  <Td align="right" className="tabular hidden text-fg-muted sm:table-cell">{c.moduleCount}</Td>
                  <Td align="right" className="tabular hidden text-fg-muted sm:table-cell">{c.assignmentCount}</Td>
                  <Td align="right" className="tabular">{c.enrolledCount}</Td>
                  <Td className="hidden whitespace-nowrap text-fg-muted md:table-cell">{timeAgo(c.updatedAt)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </>
  );
}
