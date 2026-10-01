import { useEffect, useState } from "react";
import { adminApi, courseApi } from "../../api/endpoints.js";
import { getErrorMessage } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Avatar, Button, Input, Notice, PageHeader, Panel, SearchInput, Select, Textarea, useFeedback } from "../../components/ui.jsx";

export default function Announcements() {
  const { isSuper } = useAuth();
  const { toast } = useFeedback();
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ audience: "course", courseId: "", userId: "", title: "", message: "", link: "" });
  const [person, setPerson] = useState(null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    courseApi.manage().then(({ data }) => setCourses(data.courses)).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.audience !== "specific") return;
    const t = setTimeout(() => {
      const req = isSuper ? adminApi.users({ search: search.trim() || undefined }).then(({ data }) => data.users.slice(0, 20)) : adminApi.students({ search: search.trim() || undefined }).then(({ data }) => data.students.slice(0, 20));
      req.then(setResults).catch(() => setResults([]));
    }, 200);
    return () => clearTimeout(t);
  }, [search, form.audience, isSuper]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const send = async (e) => {
    e.preventDefault();
    setError("");
    if (form.audience === "course" && !form.courseId) return setError("Pick a course.");
    if (form.audience === "specific" && !person) return setError("Pick who should receive it.");
    if (!form.title.trim() || !form.message.trim()) return setError("Add a title and a message.");
    if (form.link && !form.link.startsWith("/")) return setError("Links must be a page inside Ridgeline, starting with /");
    setBusy(true);
    try {
      const { data } = await adminApi.notify({ ...form, userId: person?._id });
      toast(data.message);
      setForm({ ...form, title: "", message: "", link: "" });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Announcements" description="Send a notification to students' bells. Students who allow email get a copy in their inbox." />
      <form onSubmit={send} className="max-w-2xl">
        <Panel
          footer={
            <div className="flex justify-end">
              <Button type="submit" variant="primary" loading={busy}>
                Send announcement
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <Select label="Send to" value={form.audience} onChange={set("audience")}>
              <option value="course">Students in one course</option>
              <option value="students">{isSuper ? "Every student" : "Every student in my courses"}</option>
              {isSuper && <option value="admins">Every admin and instructor</option>}
              {isSuper && <option value="all">Everyone on the platform</option>}
              <option value="specific">One person</option>
            </Select>

            {form.audience === "course" && (
              <Select label="Course" value={form.courseId} onChange={set("courseId")}>
                <option value="">Choose a course…</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title} ({c.enrolledCount} enrolled)
                  </option>
                ))}
              </Select>
            )}

            {form.audience === "specific" && (
              <div>
                <div className="mb-1.5 text-[13px] font-medium">Recipient</div>
                {person ? (
                  <div className="flex items-center gap-3 rounded-md border border-line px-3 py-2">
                    <Avatar user={person} size={26} />
                    <div className="min-w-0 flex-1 text-sm">
                      {person.name} <span className="text-fg-muted">· {person.email}</span>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setPerson(null)}>
                      Change
                    </Button>
                  </div>
                ) : (
                  <>
                    <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email" />
                    <ul className="mt-2 max-h-56 overflow-y-auto rounded-md border border-line">
                      {results.length === 0 && <li className="px-3 py-3 text-[13px] text-fg-muted">No one found.</li>}
                      {results.map((u) => (
                        <li key={u._id}>
                          <button type="button" onClick={() => setPerson(u)} className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-subtle">
                            <Avatar user={u} size={24} />
                            <span className="truncate">{u.name}</span>
                            <span className="truncate text-xs text-fg-muted">{u.email}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}

            <Input label="Title" value={form.title} onChange={set("title")} maxLength={120} placeholder="e.g. Lab session moved to Friday" />
            <Textarea label="Message" rows={5} value={form.message} onChange={set("message")} maxLength={1000} />
            <Input label="Link (optional)" value={form.link} onChange={set("link")} placeholder="/dashboard/assignments" hint="A page inside Ridgeline to open when they click the notification." />
            {error && <Notice tone="danger">{error}</Notice>}
          </div>
        </Panel>
      </form>
    </>
  );
}
