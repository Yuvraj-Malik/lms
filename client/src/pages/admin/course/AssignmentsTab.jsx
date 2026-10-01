import { useState } from "react";
import { ClipboardList, Pencil, Trash2 } from "lucide-react";
import { assignmentApi } from "../../../api/endpoints.js";
import { getErrorMessage } from "../../../api/client.js";
import useAsync from "../../../lib/useAsync.js";
import { dueLabel, fmtDateTime, toLocalInput } from "../../../lib/format.js";
import { Button, Dialog, EmptyState, ErrorState, IconButton, Input, Notice, Spinner, Table, Td, Textarea, Th, cx, useFeedback } from "../../../components/ui.jsx";

const AssignmentDialog = ({ courseId, assignment, onClose, onSaved }) => {
  const { toast } = useFeedback();
  const defaultDeadline = () => {
    const d = new Date(Date.now() + 7 * 86400000);
    d.setHours(23, 59, 0, 0);
    return toLocalInput(d);
  };
  const [form, setForm] = useState({
    title: assignment?.title || "",
    description: assignment?.description || "",
    instructions: assignment?.instructions || "",
    deadline: assignment ? toLocalInput(assignment.deadline) : defaultDeadline(),
    maximumMarks: assignment?.maximumMarks ?? 100,
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!form.title.trim()) return setError("Give the assignment a title.");
    if (!form.deadline) return setError("Set a deadline.");
    if (!(Number(form.maximumMarks) > 0)) return setError("Maximum marks must be more than 0.");
    setBusy(true);
    setError("");
    const payload = { ...form, deadline: new Date(form.deadline).toISOString(), maximumMarks: Number(form.maximumMarks) };
    try {
      const { data } = assignment ? await assignmentApi.update(assignment._id, payload) : await assignmentApi.create(courseId, payload);
      toast(assignment ? "Assignment saved." : "Assignment posted. Enrolled students were notified.");
      onSaved(data.assignment);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      width={640}
      title={assignment ? "Edit assignment" : "New assignment"}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save} loading={busy}>
            {assignment ? "Save" : "Post assignment"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <Textarea label="Description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <Textarea label="Instructions" rows={5} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} hint="What to build, how it will be marked, and how to submit." />
        <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
          <Input label="Deadline" type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} required hint="Extending it here also extends it for every student." />
          <Input label="Maximum marks" type="number" min={1} value={form.maximumMarks} onChange={(e) => setForm({ ...form, maximumMarks: e.target.value })} />
        </div>
        {error && <Notice tone="danger">{error}</Notice>}
      </div>
    </Dialog>
  );
};

export default function AssignmentsTab({ courseId, onShowSubmissions, onChanged }) {
  const { toast, confirm } = useFeedback();
  const { data, loading, error, reload } = useAsync(async () => (await assignmentApi.listForCourse(courseId)).data.assignments, [courseId]);
  const [editing, setEditing] = useState(null);

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const remove = async (a) => {
    const ok = await confirm({
      title: `Delete "${a.title}"?`,
      description: a.submittedCount ? `${a.submittedCount} submission${a.submittedCount === 1 ? "" : "s"} and their grades will be deleted too.` : "No one has submitted it yet.",
      confirmLabel: "Delete assignment",
      danger: true,
    });
    if (!ok) return;
    try {
      await assignmentApi.remove(a._id);
      toast("Assignment deleted.");
      reload({ quiet: true });
      onChanged?.();
    } catch (err) {
      toast(getErrorMessage(err), "danger");
    }
  };

  return (
    <div className="max-w-5xl">
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-[13px] text-fg-muted">Posting an assignment notifies every enrolled student.</p>
        <Button variant="primary" onClick={() => setEditing("new")}>
          New assignment
        </Button>
      </div>
      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        {data.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No assignments yet" description="Set work with a deadline and maximum marks. Students can submit text, files or links." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Assignment</Th>
                <Th>Deadline</Th>
                <Th align="right" className="hidden sm:table-cell">Marks</Th>
                <Th align="right">Submitted</Th>
                <Th align="right">Graded</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {data.map((a) => {
                const past = new Date(a.deadline) < new Date();
                return (
                  <tr key={a._id}>
                    <Td>
                      <button onClick={() => setEditing(a)} className="text-left font-medium hover:underline hover:underline-offset-4">
                        {a.title}
                      </button>
                    </Td>
                    <Td className="whitespace-nowrap">
                      <div>{fmtDateTime(a.deadline)}</div>
                      <div className={cx("text-xs", past ? "text-fg-subtle" : "text-fg-muted")}>{past ? "Closed" : dueLabel(a.deadline)}</div>
                    </Td>
                    <Td align="right" className="tabular hidden sm:table-cell">{a.maximumMarks}</Td>
                    <Td align="right" className="tabular">
                      <button onClick={() => onShowSubmissions(a._id)} className="hover:underline" disabled={!a.submittedCount}>
                        {a.submittedCount}
                      </button>
                    </Td>
                    <Td align="right" className={cx("tabular", a.gradedCount < a.submittedCount && "text-warn")}>
                      {a.gradedCount}
                    </Td>
                    <Td align="right" className="whitespace-nowrap">
                      <IconButton icon={Pencil} size={15} label="Edit assignment" onClick={() => setEditing(a)} />
                      <IconButton icon={Trash2} size={15} label="Delete assignment" onClick={() => remove(a)} className="hover:text-danger" />
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </div>
      {editing && (
        <AssignmentDialog
          courseId={courseId}
          assignment={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload({ quiet: true });
            onChanged?.();
          }}
        />
      )}
    </div>
  );
}
