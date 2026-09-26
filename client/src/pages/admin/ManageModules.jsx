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
    <div className="space-y-8">
      <div>
        <Link to="/admin/courses" className="inline-flex items-center gap-1.5 type-body-sm text-primary-500 hover:text-primary-600 transition-colors">
          ← Back to Courses
        </Link>
        <div className="mt-3 flex items-center justify-between">
          <h1 className="type-display text-text-primary">
            Curriculum Modules — {course.title}
          </h1>
          <Button variant="primary" onClick={openNew}>
            <Plus size={16} /> Add Module
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="type-h3 text-text-primary">
              {editingId ? "Edit Module" : "New Module"}
            </h2>
            <button onClick={() => setShowForm(false)} className="text-text-tertiary hover:text-text-primary transition-colors">
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
            <div className="pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save module"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        {modules.map((m) => (
          <Card key={m._id} className="p-5 flex items-center justify-between shadow-card">
            <div className="flex items-center gap-3.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-bg-surface-raised border border-border-subtle type-caption font-semibold text-text-secondary">
                {m.moduleOrder}
              </span>
              <div>
                <p className="type-h3 text-text-primary">{m.title}</p>
                {m.description && <p className="type-body-sm text-text-secondary mt-0.5">{m.description}</p>}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => openEdit(m)}>
                <Pencil size={14} />
              </Button>
              <Button variant="danger" size="sm" onClick={() => handleDelete(m._id, m.title)}>
                <Trash2 size={14} />
              </Button>
            </div>
          </Card>
        ))}
        {modules.length === 0 && (
          <p className="type-body text-text-secondary">No modules configured yet — add the first module above.</p>
        )}
      </div>
    </div>
  );
};

export default ManageModules;
