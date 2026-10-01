import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImagePlus } from "lucide-react";
import { adminApi, courseApi } from "../../../api/endpoints.js";
import { getErrorMessage } from "../../../api/client.js";
import { useAuth } from "../../../context/AuthContext.jsx";
import { Button, Input, Notice, Panel, Select, Switch, Textarea, useFeedback } from "../../../components/ui.jsx";

const EMPTY = { title: "", description: "", category: "", instructor: "", duration: "", difficulty: "Beginner", isPublished: false, owner: "" };

// Create (course === undefined) or edit a course's details
export default function CourseDetailsForm({ course, onSaved }) {
  const { user, isSuper } = useAuth();
  const navigate = useNavigate();
  const { toast, confirm } = useFeedback();
  const fileRef = useRef(null);
  const [form, setForm] = useState(() =>
    course
      ? {
          title: course.title,
          description: course.description,
          category: course.category,
          instructor: course.instructor,
          duration: course.duration,
          difficulty: course.difficulty,
          isPublished: course.isPublished,
          owner: course.createdBy?._id || course.createdBy || "",
        }
      : { ...EMPTY, instructor: user.name, owner: user._id }
  );
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(course?.image || "");
  const [removeImage, setRemoveImage] = useState(false);
  const [categories, setCategories] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    courseApi.categories().then(({ data }) => setCategories(data.categories)).catch(() => {});
    if (isSuper) adminApi.instructors().then(({ data }) => setInstructors(data.instructors)).catch(() => {});
  }, [isSuper]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }));

  const validate = () => {
    const e = {};
    ["title", "description", "category", "instructor", "duration"].forEach((k) => {
      if (!String(form[k]).trim()) e[k] = "Required.";
    });
    setErrors(e);
    return !Object.keys(e).length;
  };

  const save = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setBusy(true);
    const fd = new FormData();
    ["title", "description", "category", "instructor", "duration", "difficulty"].forEach((k) => fd.append(k, String(form[k]).trim()));
    fd.append("isPublished", String(form.isPublished));
    if (isSuper && form.owner) fd.append("owner", form.owner);
    if (image) fd.append("image", image);
    else if (removeImage) fd.append("removeImage", "true");
    try {
      if (course) {
        const { data } = await courseApi.update(course._id, fd);
        toast("Course saved.");
        setImage(null);
        setRemoveImage(false);
        onSaved?.(data.course);
      } else {
        const { data } = await courseApi.create(fd);
        toast("Course created. Add modules next.");
        navigate(`/admin/courses/${data.course._id}?tab=modules`, { replace: true });
      }
    } catch (err) {
      toast(getErrorMessage(err), "danger");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    const ok = await confirm({
      title: `Delete "${course.title}"?`,
      description: "This permanently removes the course with all its modules, quizzes, assignments, submissions, enrollments and discussion threads.",
      confirmLabel: "Delete course",
      danger: true,
    });
    if (!ok) return;
    try {
      await courseApi.remove(course._id);
      toast("Course deleted.");
      navigate("/admin/courses", { replace: true });
    } catch (err) {
      toast(getErrorMessage(err), "danger");
    }
  };

  return (
    <form onSubmit={save} className="max-w-3xl space-y-6">
      <Panel title="Basics">
        <div className="space-y-4">
          <Input label="Title" value={form.title} onChange={set("title")} error={errors.title} required placeholder="e.g. Full Stack Development with MERN" />
          <Textarea label="Description" rows={5} value={form.description} onChange={set("description")} error={errors.description} required hint="What students will learn and who it's for." />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Input label="Category" value={form.category} onChange={set("category")} error={errors.category} required list="course-categories" placeholder="e.g. Web Development" />
              <datalist id="course-categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <Select label="Difficulty" value={form.difficulty} onChange={set("difficulty")}>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </Select>
            <Input label="Instructor name" value={form.instructor} onChange={set("instructor")} error={errors.instructor} required hint="Shown to students." />
            <Input label="Duration" value={form.duration} onChange={set("duration")} error={errors.duration} required placeholder="e.g. 6 weeks" />
          </div>
        </div>
      </Panel>

      <Panel title="Cover image" description="Optional. A wide image (16:9) works best.">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="aspect-[16/9] w-full max-w-[260px] overflow-hidden rounded-md border border-line bg-subtle">
            {preview && !removeImage ? (
              <img src={preview} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-fg-subtle">
                <ImagePlus size={20} />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setImage(f);
                  setPreview(URL.createObjectURL(f));
                  setRemoveImage(false);
                }
              }}
            />
            <Button size="sm" onClick={() => fileRef.current?.click()}>
              {preview && !removeImage ? "Replace" : "Upload"}
            </Button>
            {preview && !removeImage && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setImage(null);
                  setRemoveImage(true);
                }}
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      </Panel>

      <Panel title="Visibility" bodyClassName="px-5 py-1">
        <Switch
          label="Published"
          description="Published courses appear in the catalog and students can enroll. Drafts are only visible to you and the super admin."
          checked={form.isPublished}
          onChange={(v) => setForm((f) => ({ ...f, isPublished: v }))}
        />
      </Panel>

      {isSuper && (
        <Panel title="Ownership" description="The owner is the instructor who can edit this course. Only the super admin can change it.">
          <Select value={form.owner} onChange={set("owner")} aria-label="Owner">
            {instructors.map((i) => (
              <option key={i._id} value={i._id}>
                {i.name} — {i.email}
                {i.isSuperAdmin ? " (super admin)" : ""}
              </option>
            ))}
          </Select>
        </Panel>
      )}

      {Object.keys(errors).length > 0 && <Notice tone="danger">Fill in the required fields above.</Notice>}

      <div className="flex items-center justify-between gap-4">
        {course ? (
          <Button variant="danger-ghost" onClick={remove}>
            Delete course
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          {!course && <Button to="/admin/courses">Cancel</Button>}
          <Button type="submit" variant="primary" loading={busy}>
            {course ? "Save changes" : "Create course"}
          </Button>
        </div>
      </div>
    </form>
  );
}
