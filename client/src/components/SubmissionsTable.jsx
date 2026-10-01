import { useEffect, useMemo, useState } from "react";
import { Inbox } from "lucide-react";
import { timeAgo } from "../lib/format.js";
import GradeDialog from "./GradeDialog.jsx";
import { Avatar, EmptyState, Segmented, Select, StatusBadge, Table, Td, Th } from "./ui.jsx";

// Shared by the global grading queue and each course's Submissions tab
export default function SubmissionsTable({ submissions, setSubmissions, showCourse = true, initialOpenId, assignments, initialAssignment = "" }) {
  const [status, setStatus] = useState(initialAssignment ? "all" : "pending");
  const [assignment, setAssignment] = useState(initialAssignment);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    if (initialOpenId) {
      const s = submissions.find((x) => x._id === initialOpenId);
      if (s) setOpen(s);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOpenId]);

  const rows = useMemo(
    () =>
      submissions.filter(
        (s) =>
          (status === "all" || (status === "pending" ? s.status !== "graded" : s.status === status)) &&
          (!assignment || s.assignment?._id === assignment)
      ),
    [submissions, status, assignment]
  );

  const pendingCount = submissions.filter((s) => s.status !== "graded").length;

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Segmented
          value={status}
          onChange={setStatus}
          options={[
            { value: "pending", label: `Needs grading (${pendingCount})` },
            { value: "graded", label: "Graded" },
            { value: "all", label: "All" },
          ]}
        />
        {assignments && assignments.length > 0 && (
          <Select value={assignment} onChange={(e) => setAssignment(e.target.value)} selectClassName="sm:w-64" aria-label="Assignment">
            <option value="">All assignments</option>
            {assignments.map((a) => (
              <option key={a._id} value={a._id}>
                {a.title}
              </option>
            ))}
          </Select>
        )}
      </div>
      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        {rows.length === 0 ? (
          <EmptyState icon={Inbox} title={status === "pending" ? "Nothing waiting to be graded" : "No submissions here"} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Student</Th>
                <Th>Assignment</Th>
                <Th className="hidden md:table-cell">Submitted</Th>
                <Th>Status</Th>
                <Th align="right">Marks</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s._id} onClick={() => setOpen(s)} className="cursor-pointer hover:bg-subtle">
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <Avatar user={s.student} size={26} />
                      <div className="min-w-0">
                        <div className="truncate font-medium">{s.student?.name}</div>
                        <div className="truncate text-xs text-fg-muted">{s.student?.email}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <div className="truncate">{s.assignment?.title}</div>
                    {showCourse && <div className="truncate text-xs text-fg-muted">{s.assignment?.course?.title}</div>}
                  </Td>
                  <Td className="hidden whitespace-nowrap text-fg-muted md:table-cell">{timeAgo(s.submissionDate)}</Td>
                  <Td>
                    <StatusBadge status={s.status} />
                  </Td>
                  <Td align="right" className="tabular whitespace-nowrap">
                    {s.status === "graded" ? (
                      <>
                        {s.marks}
                        <span className="text-fg-subtle">/{s.assignment?.maximumMarks}</span>
                      </>
                    ) : (
                      <span className="text-[13px] font-medium text-accent-fg">Grade</span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
      {open && (
        <GradeDialog
          submission={open}
          onClose={() => setOpen(null)}
          onSaved={(updated) => {
            setSubmissions((list) => list.map((x) => (x._id === updated._id ? { ...x, ...updated } : x)));
            setOpen(null);
          }}
          onReopened={(id) => {
            setSubmissions((list) => list.filter((x) => x._id !== id));
            setOpen(null);
          }}
        />
      )}
    </>
  );
}
