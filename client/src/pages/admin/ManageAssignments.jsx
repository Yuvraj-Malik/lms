import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Plus, Trash2, Pencil, X, FileCheck } from "lucide-react";
import { courseApi, assignmentApi } from "../../api/endpoints.js";
import { getErrorMessage } from "../../api/client.js";
import { Card, Input, Textarea, Button, Alert, Spinner } from "../../components/ui.jsx";

const emptyForm = { title: "", description: "", instructions: "", deadline: "", maximumMarks: 100 };

const toLocalInput = (iso) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");

const ManageAssignments = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    const [courseRes, assignmentsRes] = await Promise.all([
      courseApi.get(courseId),
      assignmentApi.listForCourse(courseId),
    ]);
    setCourse(courseRes.data.course);
    setAssignments(assignmentsRes.data.assignments);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (a) => {
    setEditingId(a._id);
    setForm({
      title: a.title,
      description: a.description || "",
      instructions: a.instructions || "",
      deadline: toLocalInput(a.deadline),
      maximumMarks: a.maximumMarks,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = { ...form, maximumMarks: Number(form.maximumMarks) };
      if (editingId) await assignmentApi.update(editingId, payload);
      else await assignmentApi.create(courseId, payload);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete assignment "${title}" and all its submissions?`)) return;
    await assignmentApi.remove(id);
    await load();
  };

  if (!course || !assignments) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div>
      <Link to="/admin/courses" className="text-xs font-medium text-pine dark:text-amber-light">
        ← Back to Courses
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink dark:text-dark-ink">
          Assignments — {course.title}
        </h1>
        <Button onClick={openNew}>
          <Plus size={16} /> Add assignment
        </Button>
      </div>

      {showForm && (
        <Card className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink dark:text-dark-ink">
              {editingId ? "Edit assignment" : "New assignment"}
            </h2>
            <button onClick={() => setShowForm(false)} className="text-ink-soft dark:text-dark-ink-soft">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert>{error}</Alert>}
            <Input label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Textarea
              label="Description"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <Textarea
              label="Instructions"
              rows={3}
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Deadline"
                type="datetime-local"
                required
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
              <Input
                label="Maximum marks"
                type="number"
                required
                min={1}
                value={form.maximumMarks}
                onChange={(e) => setForm({ ...form, maximumMarks: e.target.value })}
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save assignment"}
            </Button>
          </form>
        </Card>
      )}

      <div className="mt-6 space-y-2">
        {assignments.map((a) => (
          <Card key={a._id} className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-ink dark:text-dark-ink">{a.title}</p>
              <p className="text-xs text-ink-soft dark:text-dark-ink-soft">
                Due {new Date(a.deadline).toLocaleString()} · Max marks {a.maximumMarks}
              </p>
            </div>
            <div className="flex gap-2">
              <Link to={`/admin/assignments/${a._id}/submissions`}>
                <Button variant="secondary">
                  <FileCheck size={14} /> Submissions
                </Button>
              </Link>
              <Button variant="secondary" onClick={() => openEdit(a)}>
                <Pencil size={14} />
              </Button>
              <Button variant="danger" onClick={() => handleDelete(a._id, a.title)}>
                <Trash2 size={14} />
              </Button>
            </div>
          </Card>
        ))}
        {assignments.length === 0 && (
          <p className="text-sm text-ink-soft dark:text-dark-ink-soft">No assignments yet — add the first one.</p>
        )}
      </div>
    </div>
  );
};

export default ManageAssignments;
