import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import { adminApi, enrollmentApi } from "../../../api/endpoints.js";
import { getErrorMessage } from "../../../api/client.js";
import useAsync from "../../../lib/useAsync.js";
import { fmtDate } from "../../../lib/format.js";
import { exportToCsv } from "../../../utils/csvExport.js";
import { Avatar, Button, Dialog, EmptyState, ErrorState, ProgressBar, SearchInput, Spinner, StatusBadge, Table, Td, Th, useFeedback } from "../../../components/ui.jsx";

const AddStudentDialog = ({ courseId, enrolledIds, onClose, onAdded }) => {
  const { toast } = useFeedback();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      adminApi
        .directory(search.trim())
        .then(({ data }) => setResults(data.students))
        .catch(() => setResults([]));
    }, 200);
    return () => clearTimeout(t);
  }, [search]);

  const add = async (s) => {
    setBusyId(s._id);
    try {
      await adminApi.enroll(s._id, courseId);
      toast(`${s.name} enrolled.`);
      onAdded();
    } catch (err) {
      toast(getErrorMessage(err), "danger");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Dialog open onClose={onClose} title="Enroll a student" description="Search by name or email. They'll get a notification.">
      <SearchInput value={search} onChange={setSearch} placeholder="Name or email" />
      <ul className="mt-3 max-h-80 overflow-y-auto">
        {results.length === 0 && <li className="py-6 text-center text-[13px] text-fg-muted">No students found.</li>}
        {results.map((s) => {
          const enrolled = enrolledIds.has(s._id);
          return (
            <li key={s._id} className="flex items-center gap-3 border-b border-line py-2.5 last:border-0">
              <Avatar user={s} size={28} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm">{s.name}</div>
                <div className="truncate text-xs text-fg-muted">{s.email}</div>
              </div>
              <Button size="sm" disabled={enrolled} loading={busyId === s._id} onClick={() => add(s)}>
                {enrolled ? "Enrolled" : "Enroll"}
              </Button>
            </li>
          );
        })}
      </ul>
    </Dialog>
  );
};

export default function StudentsTab({ courseId, courseTitle, moduleCount }) {
  const { toast, confirm } = useFeedback();
  const { data, loading, error, reload } = useAsync(async () => (await enrollmentApi.forCourse(courseId)).data.enrollments, [courseId]);
  const [adding, setAdding] = useState(false);

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const remove = async (e) => {
    const ok = await confirm({
      title: `Remove ${e.student.name} from this course?`,
      description: "Their progress, quiz attempts and submissions for this course are deleted.",
      confirmLabel: "Remove student",
      danger: true,
    });
    if (!ok) return;
    try {
      await adminApi.unenroll(e._id);
      toast(`${e.student.name} removed.`);
      reload({ quiet: true });
    } catch (err) {
      toast(getErrorMessage(err), "danger");
    }
  };

  const exportRoster = () =>
    exportToCsv(
      `${courseTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-roster`,
      data.map((e) => ({
        name: e.student.name,
        email: e.student.email,
        enrolled: fmtDate(e.enrollmentDate),
        modules: `${e.completedModules.length}/${moduleCount}`,
        progress: `${e.progress}%`,
        status: e.status,
      })),
      [
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "enrolled", label: "Enrolled" },
        { key: "modules", label: "Modules completed" },
        { key: "progress", label: "Progress" },
        { key: "status", label: "Status" },
      ]
    );

  return (
    <div className="max-w-5xl">
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-[13px] text-fg-muted">
          {data.length} student{data.length === 1 ? "" : "s"} enrolled
        </p>
        <div className="flex gap-2">
          {data.length > 0 && <Button onClick={exportRoster}>Export CSV</Button>}
          <Button variant="primary" onClick={() => setAdding(true)}>
            Enroll student
          </Button>
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        {data.length === 0 ? (
          <EmptyState icon={Users} title="No one has enrolled yet" description="Students enroll from the catalog once the course is published, or you can add them here." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Student</Th>
                <Th className="w-[30%]">Progress</Th>
                <Th className="hidden md:table-cell">Enrolled</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {data.map((e) => (
                <tr key={e._id}>
                  <Td>
                    <Link to={`/admin/students/${e.student._id}`} className="flex items-center gap-2.5">
                      <Avatar user={e.student} size={26} />
                      <span className="min-w-0">
                        <span className="block truncate font-medium hover:underline">{e.student.name}</span>
                        <span className="block truncate text-xs text-fg-muted">{e.student.email}</span>
                      </span>
                    </Link>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-3">
                      <ProgressBar value={e.progress} tone={e.status === "completed" ? "ok" : "accent"} />
                      <span className="tabular shrink-0 text-xs text-fg-muted">
                        {e.completedModules.length}/{moduleCount}
                      </span>
                    </div>
                  </Td>
                  <Td className="hidden whitespace-nowrap text-fg-muted md:table-cell">{fmtDate(e.enrollmentDate)}</Td>
                  <Td>
                    <StatusBadge status={e.status === "completed" ? "completed" : e.progress > 0 ? "active" : "not-started"} />
                  </Td>
                  <Td align="right">
                    <Button size="sm" variant="ghost" onClick={() => remove(e)}>
                      Remove
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
      {adding && (
        <AddStudentDialog
          courseId={courseId}
          enrolledIds={new Set(data.map((e) => e.student._id))}
          onClose={() => setAdding(false)}
          onAdded={() => reload({ quiet: true })}
        />
      )}
    </div>
  );
}
