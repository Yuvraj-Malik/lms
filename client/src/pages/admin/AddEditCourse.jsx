import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { courseApi } from "../../api/endpoints.js";
import { getErrorMessage } from "../../api/client.js";
import { Card, Input, Textarea, Select, Button, Alert, Spinner } from "../../components/ui.jsx";

const emptyForm = {
  title: "",
  description: "",
  category: "",
  instructor: "",
  duration: "",
  difficulty: "Beginner",
};

const AddEditCourse = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState(null);
  const [existingImage, setExistingImage] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEdit) return;
    courseApi.get(id).then(({ data }) => {
      const c = data.course;
      setForm({
        title: c.title,
        description: c.description,
        category: c.category,
        instructor: c.instructor,
        duration: c.duration,
        difficulty: c.difficulty,
      });
      setExistingImage(c.image);
      setLoading(false);
    });
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (image) fd.append("image", image);

      if (isEdit) await courseApi.update(id, fd);
      else await courseApi.create(fd);

      navigate("/admin/courses");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="type-display font-semibold text-text-primary">
        {isEdit ? "Edit Course" : "New Course"}
      </h1>

      <Card className="mt-6 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert tone="danger">{error}</Alert>}

          <Input label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Textarea
            label="Description"
            required
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Category"
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
            <Input
              label="Instructor"
              required
              value={form.instructor}
              onChange={(e) => setForm({ ...form, instructor: e.target.value })}
            />
            <Input
              label="Duration (e.g. 6 weeks)"
              required
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
            />
            <Select
              label="Difficulty"
              value={form.difficulty}
              onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </Select>
          </div>

          <label className="block">
            <span className="mb-1.5 block type-body-sm font-medium text-text-primary">Course image</span>
            {existingImage && !image && (
              <img src={existingImage} alt="" className="mb-2 h-28 w-44 rounded-md object-cover border border-border-subtle" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0])}
              className="type-body-sm text-text-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded-sm file:border file:border-border-default file:bg-bg-surface-raised file:text-text-primary file:type-caption file:cursor-pointer"
            />
          </label>

          <div className="pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create course"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AddEditCourse;
