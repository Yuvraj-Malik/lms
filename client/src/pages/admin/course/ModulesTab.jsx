import { useState } from "react";
import { ArrowDown, ArrowUp, Layers, Pencil, Trash2 } from "lucide-react";
import { moduleApi } from "../../../api/endpoints.js";
import { getErrorMessage } from "../../../api/client.js";
import useAsync from "../../../lib/useAsync.js";
import { Badge, Button, EmptyState, ErrorState, IconButton, Spinner, useFeedback } from "../../../components/ui.jsx";
import ModuleDialog from "./ModuleDialog.jsx";

export default function ModulesTab({ courseId, onChanged }) {
  const { toast, confirm } = useFeedback();
  const { data, loading, error, reload, setData } = useAsync(async () => (await moduleApi.listForCourse(courseId)).data.modules, [courseId]);
  const [editing, setEditing] = useState(null); // null | "new" | module
  const [moving, setMoving] = useState(false);

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const move = async (index, dir) => {
    const order = data.map((m) => m._id);
    const j = index + dir;
    [order[index], order[j]] = [order[j], order[index]];
    setMoving(true);
    try {
      const { data: res } = await moduleApi.reorder(courseId, order);
      setData(res.modules);
    } catch (err) {
      toast(getErrorMessage(err), "danger");
    } finally {
      setMoving(false);
    }
  };

  const remove = async (m) => {
    const ok = await confirm({
      title: `Delete "${m.title}"?`,
      description: "Its notes, quiz and quiz attempts are removed. Students' progress in this course is recalculated.",
      confirmLabel: "Delete module",
      danger: true,
    });
    if (!ok) return;
    try {
      await moduleApi.remove(m._id);
      toast("Module deleted.");
      await reload({ quiet: true });
      onChanged?.();
    } catch (err) {
      toast(getErrorMessage(err), "danger");
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-[13px] text-fg-muted">Students work through modules in this order. Use the arrows to reorder.</p>
        <Button variant="primary" onClick={() => setEditing("new")}>
          Add module
        </Button>
      </div>
      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        {data.length === 0 ? (
          <EmptyState icon={Layers} title="No modules yet" description="Modules hold your lesson notes, resource links and an optional quiz." />
        ) : (
          <ol>
            {data.map((m, i) => (
              <li key={m._id} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0">
                <div className="flex flex-col">
                  <IconButton icon={ArrowUp} size={14} label="Move up" disabled={i === 0 || moving} onClick={() => move(i, -1)} className="h-6 w-6" />
                  <IconButton icon={ArrowDown} size={14} label="Move down" disabled={i === data.length - 1 || moving} onClick={() => move(i, 1)} className="h-6 w-6" />
                </div>
                <span className="tabular w-6 shrink-0 text-[13px] text-fg-subtle">{String(m.moduleOrder).padStart(2, "0")}</span>
                <button onClick={() => setEditing(m)} className="min-w-0 flex-1 text-left">
                  <div className="truncate text-sm font-medium hover:underline hover:underline-offset-4">{m.title}</div>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-fg-muted">
                    <span>{m.notes ? `${m.notes.split(/\s+/).length} words of notes` : "No notes"}</span>
                    <span>{m.resourceLinks.length} resource{m.resourceLinks.length === 1 ? "" : "s"}</span>
                  </div>
                </button>
                {m.quiz.length > 0 ? <Badge tone="accent">Quiz · {m.quiz.length}</Badge> : <Badge>No quiz</Badge>}
                <IconButton icon={Pencil} size={15} label="Edit module" onClick={() => setEditing(m)} />
                <IconButton icon={Trash2} size={15} label="Delete module" onClick={() => remove(m)} className="hover:text-danger" />
              </li>
            ))}
          </ol>
        )}
      </div>
      {editing && (
        <ModuleDialog
          courseId={courseId}
          module={editing === "new" ? null : editing}
          nextOrder={data.length + 1}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await reload({ quiet: true });
            onChanged?.();
          }}
        />
      )}
    </div>
  );
}
