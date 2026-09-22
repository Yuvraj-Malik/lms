import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Plus, Trash2, Pencil, X } from "lucide-react";
import { courseApi, moduleApi } from "../../api/endpoints.js";
import { getErrorMessage } from "../../api/client.js";
import { Card, Input, Textarea, Button, Alert, Spinner } from "../../components/ui.jsx";

const emptyForm = { title: "", description: "", notes: "", resourceLinks: "", moduleOrder: "" };

const ManageModules = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    const [courseRes, modulesRes] = await Promise.all([courseApi.get(courseId), moduleApi.listForCourse(courseId)]);
    setCourse(courseRes.data.course);
    setModules(modulesRes.data.modules);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const openNew = () => {
    setEditingId(null);
    setForm({ ...emptyForm, moduleOrder: (modules?.length || 0) + 1 });
    setShowForm(true);
  };

  const openEdit = (m) => {
    setEditingId(m._id);
    setForm({
      title: m.title,
      description: m.description || "",
      notes: m.notes || "",
      resourceLinks: (m.resourceLinks || []).join("\n"),
      moduleOrder: m.moduleOrder,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        ...form,
        moduleOrder: Number(form.moduleOrder),
        resourceLinks: form.resourceLinks.split("\n").map((s) => s.trim()).filter(Boolean),
      };
      if (editingId) await moduleApi.update(editingId, payload);
      else await moduleApi.create(courseId, payload);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete module "${title}"?`)) return;
    await moduleApi.remove(id);
    await load();
  };

  if (!course || !modules) {
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
          Modules — {course.title}
        </h1>
        <Button onClick={openNew}>
          <Plus size={16} /> Add module
        </Button>
      </div>

      {showForm && (
        <Card className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink dark:text-dark-ink">
              {editingId ? "Edit module" : "New module"}
            </h2>
            <button onClick={() => setShowForm(false)} className="text-ink-soft dark:text-dark-ink-soft">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert>{error}</Alert>}
            <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
              <Input label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <Input
                label="Order"
                type="number"
                required
                min={1}
                value={form.moduleOrder}
                onChange={(e) => setForm({ ...form, moduleOrder: e.target.value })}
              />
            </div>
            <Textarea
              label="Description"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <Textarea
              label="Notes"
              rows={4}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
            <Textarea
              label="Resource links (one per line — PDFs, videos, references, source code)"
              rows={3}
              value={form.resourceLinks}
              onChange={(e) => setForm({ ...form, resourceLinks: e.target.value })}
            />
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save module"}
            </Button>
          </form>
        </Card>
      )}

      <div className="mt-6 space-y-2">
        {modules.map((m) => (
          <Card key={m._id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-sunken text-xs font-medium text-ink-soft dark:bg-dark-surface-sunken dark:text-dark-ink-soft">
                {m.moduleOrder}
              </span>
              <div>
                <p className="text-sm font-medium text-ink dark:text-dark-ink">{m.title}</p>
                {m.description && <p className="text-xs text-ink-soft dark:text-dark-ink-soft">{m.description}</p>}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => openEdit(m)}>
                <Pencil size={14} />
              </Button>
              <Button variant="danger" onClick={() => handleDelete(m._id, m.title)}>
                <Trash2 size={14} />
              </Button>
            </div>
          </Card>
        ))}
        {modules.length === 0 && (
          <p className="text-sm text-ink-soft dark:text-dark-ink-soft">No modules yet — add the first one.</p>
        )}
      </div>
    </div>
  );
};

export default ManageModules;
