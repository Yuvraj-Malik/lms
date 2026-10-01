import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import { assignmentApi } from "../../api/endpoints.js";
import useAsync from "../../lib/useAsync.js";
import { assignmentState, dueLabel, fmtDate, daysUntil } from "../../lib/format.js";
import { EmptyState, ErrorState, PageHeader, PageLoader, StatusBadge, Table, Tabs, Td, Th, cx } from "../../components/ui.jsx";

export default function Assignments() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "todo";
  const { data, loading, error, reload } = useAsync(async () => (await assignmentApi.my()).data.assignments, []);

  const groups = useMemo(() => {
    const rows = (data || []).map((a) => ({ ...a, state: assignmentState(a, a.mySubmission) }));
    return {
      todo: rows.filter((r) => r.state === "todo" || r.state === "overdue").sort((a, b) => new Date(a.deadline) - new Date(b.deadline)),
      submitted: rows.filter((r) => r.state === "submitted" || r.state === "late"),
      graded: rows.filter((r) => r.state === "graded"),
      all: rows,
    };
  }, [data]);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const rows = groups[tab] || groups.todo;

  return (
    <>
      <PageHeader title="Assignments" description="Everything set in the courses you're enrolled in." />
      <Tabs
        className="mb-5"
        value={tab}
        onChange={(v) => setParams({ tab: v }, { replace: true })}
        tabs={[
          { value: "todo", label: "To do", count: groups.todo.length },
          { value: "submitted", label: "Awaiting grade", count: groups.submitted.length },
          { value: "graded", label: "Graded", count: groups.graded.length },
          { value: "all", label: "All", count: groups.all.length },
        ]}
      />
      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        {rows.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={tab === "todo" ? "Nothing to do" : "No assignments here"}
            description={
              data.length === 0
                ? "Your courses don't have any assignments yet."
                : tab === "todo"
                  ? "You've submitted everything that's been set."
                  : "Assignments will appear here as you submit them."
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Assignment</Th>
                <Th className="hidden md:table-cell">Course</Th>
                <Th>Due</Th>
                <Th>Status</Th>
                <Th align="right">Marks</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a._id} className="hover:bg-subtle">
                  <Td>
                    <Link to={`/dashboard/assignments/${a._id}`} className="font-medium hover:underline hover:underline-offset-4">
                      {a.title}
                    </Link>
                    <div className="text-xs text-fg-muted md:hidden">{a.course?.title}</div>
                  </Td>
                  <Td className="hidden text-fg-muted md:table-cell">{a.course?.title}</Td>
                  <Td className="whitespace-nowrap">
                    <span
                      className={cx(
                        a.state === "overdue" ? "text-danger" : a.state === "todo" && daysUntil(a.deadline) <= 2 ? "text-warn" : "text-fg-muted"
                      )}
                    >
                      {a.state === "todo" || a.state === "overdue" ? dueLabel(a.deadline) : fmtDate(a.deadline)}
                    </span>
                  </Td>
                  <Td>
                    <StatusBadge status={a.state} />
                  </Td>
                  <Td align="right" className="tabular whitespace-nowrap">
                    {a.state === "graded" ? (
                      <>
                        {a.mySubmission.marks}
                        <span className="text-fg-subtle">/{a.maximumMarks}</span>
                      </>
                    ) : (
                      <span className="text-fg-subtle">{a.maximumMarks}</span>
                    )}
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
