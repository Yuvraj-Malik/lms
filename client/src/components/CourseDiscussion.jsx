import { useState } from "react";
import { ArrowUp, MessageSquare, Trash2 } from "lucide-react";
import { discussionApi } from "../api/endpoints.js";
import { getErrorMessage } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import useAsync from "../lib/useAsync.js";
import { timeAgo } from "../lib/format.js";
import { Avatar, Badge, Button, EmptyState, ErrorState, IconButton, Input, Select, Spinner, Textarea, cx, useFeedback } from "./ui.jsx";

const CATEGORIES = ["General", "Module Question", "Assignment Help", "Bug/Issue"];

const Thread = ({ d, me, canModerate, onChange, onDelete }) => {
  const { toast, confirm } = useFeedback();
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const voted = d.upvotes.some((u) => String(u) === String(me._id));

  const run = async (fn) => {
    try {
      const { data } = await fn();
      onChange(data.discussion);
    } catch (err) {
      toast(getErrorMessage(err), "danger");
    }
  };

  const sendReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setBusy(true);
    await run(() => discussionApi.reply(d._id, reply.trim()));
    setReply("");
    setBusy(false);
  };

  const canDelete = canModerate || String(d.user?._id) === String(me._id);

  return (
    <li className="border-b border-line px-5 py-4 last:border-0">
      <div className="flex gap-3">
        <button
          onClick={() => run(() => discussionApi.upvote(d._id))}
          aria-label={voted ? "Remove upvote" : "Upvote"}
          className={cx(
            "flex h-12 w-10 shrink-0 flex-col items-center justify-center rounded-md border text-xs",
            voted ? "border-accent bg-accent-soft text-accent-fg" : "border-line text-fg-muted hover:border-line-strong"
          )}
        >
          <ArrowUp size={14} />
          <span className="tabular">{d.upvotes.length}</span>
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <button onClick={() => setOpen((v) => !v)} className="text-left text-sm font-medium hover:underline hover:underline-offset-4">
              {d.title}
            </button>
            {canDelete && (
              <IconButton
                icon={Trash2}
                size={14}
                label="Delete thread"
                className="-mr-1 -mt-1 h-7 w-7"
                onClick={async () => {
                  if (await confirm({ title: "Delete this thread?", description: "All replies will be removed too.", confirmLabel: "Delete", danger: true })) onDelete(d._id);
                }}
              />
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fg-muted">
            <span>{d.user?.name || "Deleted user"}</span>
            <span className="text-fg-subtle">·</span>
            <span>{timeAgo(d.createdAt)}</span>
            <Badge>{d.category}</Badge>
            <button onClick={() => setOpen((v) => !v)} className="inline-flex items-center gap-1 hover:text-fg">
              <MessageSquare size={12} /> {d.replies.length}
            </button>
          </div>
          {open && (
            <div className="mt-3">
              <p className="prose-notes text-sm">{d.content}</p>
              <ul className="mt-4 space-y-3 border-l-2 border-line pl-4">
                {d.replies.map((r) => (
                  <li key={r._id} className="group">
                    <div className="flex items-center gap-2 text-xs">
                      <Avatar user={r.user} size={20} />
                      <span className="font-medium text-fg">{r.user?.name || "Deleted user"}</span>
                      {r.isInstructorAnswer && <Badge tone="accent">Instructor</Badge>}
                      <span className="text-fg-subtle">{timeAgo(r.createdAt)}</span>
                      {(canModerate || String(r.user?._id) === String(me._id)) && (
                        <button
                          onClick={() => run(() => discussionApi.removeReply(d._id, r._id))}
                          className="ml-auto text-fg-subtle opacity-0 hover:text-danger group-hover:opacity-100"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p className="prose-notes mt-1 text-sm">{r.content}</p>
                  </li>
                ))}
              </ul>
              <form onSubmit={sendReply} className="mt-4 flex gap-2">
                <Input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a reply" className="flex-1" aria-label="Reply" />
                <Button type="submit" loading={busy} disabled={!reply.trim()}>
                  Reply
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </li>
  );
};

export default function CourseDiscussion({ courseId }) {
  const { user } = useAuth();
  const { toast } = useFeedback();
  const { data, loading, error, reload, setData } = useAsync(async () => (await discussionApi.forCourse(courseId)).data, [courseId]);
  const [composing, setComposing] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", category: "General" });
  const [busy, setBusy] = useState(false);

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const replace = (thread) => setData((d) => ({ ...d, discussions: d.discussions.map((x) => (x._id === thread._id ? thread : x)) }));
  const remove = async (id) => {
    try {
      await discussionApi.remove(id);
      setData((d) => ({ ...d, discussions: d.discussions.filter((x) => x._id !== id) }));
    } catch (err) {
      toast(getErrorMessage(err), "danger");
    }
  };

  const post = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data: res } = await discussionApi.create(courseId, form);
      setData((d) => ({ ...d, discussions: [res.discussion, ...d.discussions] }));
      setForm({ title: "", content: "", category: "General" });
      setComposing(false);
    } catch (err) {
      toast(getErrorMessage(err), "danger");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-line bg-surface">
      <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
        <p className="text-[13px] text-fg-muted">Ask questions and help classmates. Instructor replies are marked.</p>
        {!composing && (
          <Button size="sm" variant="primary" onClick={() => setComposing(true)}>
            New thread
          </Button>
        )}
      </div>
      {composing && (
        <form onSubmit={post} className="space-y-3 border-b border-line bg-subtle/50 px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
            <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <Select label="Topic" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </div>
          <Textarea label="Details" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required rows={4} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setComposing(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={busy} disabled={!form.title.trim() || !form.content.trim()}>
              Post
            </Button>
          </div>
        </form>
      )}
      {data.discussions.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No threads yet" description="Start the conversation with a question about the course." />
      ) : (
        <ul>
          {data.discussions.map((d) => (
            <Thread key={d._id} d={d} me={user} canModerate={data.canModerate} onChange={replace} onDelete={remove} />
          ))}
        </ul>
      )}
    </div>
  );
}
