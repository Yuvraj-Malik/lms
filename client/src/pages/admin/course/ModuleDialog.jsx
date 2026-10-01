import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { moduleApi } from "../../../api/endpoints.js";
import { getErrorMessage } from "../../../api/client.js";
import { Button, Dialog, IconButton, Input, Notice, Tabs, Textarea, cx, useFeedback } from "../../../components/ui.jsx";

const blankQuestion = () => ({ question: "", options: ["", ""], answer: 0, explanation: "" });

const QuizBuilder = ({ quiz, setQuiz, passPercent, setPassPercent }) => {
  const update = (qi, patch) => setQuiz(quiz.map((q, i) => (i === qi ? { ...q, ...patch } : q)));
  const setOption = (qi, oi, value) => update(qi, { options: quiz[qi].options.map((o, i) => (i === oi ? value : o)) });
  const removeOption = (qi, oi) => {
    const q = quiz[qi];
    const options = q.options.filter((_, i) => i !== oi);
    const answer = q.answer === oi ? 0 : q.answer > oi ? q.answer - 1 : q.answer;
    update(qi, { options, answer });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <p className="text-[13px] text-fg-muted">
          {quiz.length === 0
            ? "No quiz. Students complete this module with a 'Mark as complete' button."
            : "Students must pass this quiz to complete the module. Answers are checked on the server."}
        </p>
        {quiz.length > 0 && (
          <Input
            label="Pass mark (%)"
            type="number"
            min={0}
            max={100}
            value={passPercent}
            onChange={(e) => setPassPercent(e.target.value)}
            className="w-28 shrink-0"
          />
        )}
      </div>

      {quiz.map((q, qi) => (
        <div key={qi} className="rounded-md border border-line p-4">
          <div className="flex items-start gap-2">
            <span className="tabular mt-2 w-5 shrink-0 text-[13px] text-fg-subtle">{qi + 1}.</span>
            <Input value={q.question} onChange={(e) => update(qi, { question: e.target.value })} placeholder="Question" className="flex-1" aria-label={`Question ${qi + 1}`} />
            <IconButton icon={Trash2} label="Remove question" onClick={() => setQuiz(quiz.filter((_, i) => i !== qi))} className="mt-0.5" />
          </div>
          <div className="mt-3 space-y-2 pl-7">
            {q.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <label className="flex shrink-0 cursor-pointer items-center" title="Correct answer">
                  <input type="radio" name={`correct-${qi}`} checked={q.answer === oi} onChange={() => update(qi, { answer: oi })} className="accent-[var(--accent)]" />
                </label>
                <input
                  value={opt}
                  onChange={(e) => setOption(qi, oi, e.target.value)}
                  placeholder={`Option ${oi + 1}`}
                  className={cx(
                    "h-8 flex-1 rounded-md border bg-surface px-2.5 text-sm outline-none focus:border-accent",
                    q.answer === oi ? "border-accent" : "border-line-strong"
                  )}
                />
                <IconButton icon={Trash2} size={14} label="Remove option" disabled={q.options.length <= 2} onClick={() => removeOption(qi, oi)} className="h-7 w-7" />
              </div>
            ))}
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => update(qi, { options: [...q.options, ""] })} disabled={q.options.length >= 6} className="text-[13px] text-fg-muted hover:text-fg disabled:opacity-40">
                + Add option
              </button>
              <span className="text-xs text-fg-subtle">Select the circle next to the correct answer</span>
            </div>
            <Input value={q.explanation} onChange={(e) => update(qi, { explanation: e.target.value })} placeholder="Explanation shown after submitting (optional)" aria-label="Explanation" />
          </div>
        </div>
      ))}

      <Button icon={Plus} onClick={() => setQuiz([...quiz, blankQuestion()])}>
        Add question
      </Button>
    </div>
  );
};

export default function ModuleDialog({ courseId, module, nextOrder, onClose, onSaved }) {
  const { toast } = useFeedback();
  const [tab, setTab] = useState("content");
  const [form, setForm] = useState({
    title: module?.title || "",
    description: module?.description || "",
    notes: module?.notes || "",
    resourceLinks: (module?.resourceLinks || []).join("\n"),
  });
  const [quiz, setQuiz] = useState(() => (module?.quiz || []).map(({ question, options, answer, explanation }) => ({ question, options: [...options], answer, explanation: explanation || "" })));
  const [passPercent, setPassPercent] = useState(module?.quizPassPercent ?? 60);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const validate = () => {
    if (!form.title.trim()) return "Give the module a title.";
    const bad = form.resourceLinks.split(/\n/).map((l) => l.trim()).filter(Boolean).find((l) => !/^https?:\/\//i.test(l));
    if (bad) return `"${bad}" isn't a full link. Links must start with https://`;
    for (const [i, q] of quiz.entries()) {
      if (!q.question.trim()) return `Question ${i + 1} is empty.`;
      const filled = q.options.filter((o) => o.trim());
      if (filled.length < 2) return `Question ${i + 1} needs at least two options.`;
      if (!q.options[q.answer]?.trim()) return `The correct answer for question ${i + 1} is blank.`;
    }
    const p = Number(passPercent);
    if (quiz.length && (!Number.isFinite(p) || p < 0 || p > 100)) return "Pass mark must be between 0 and 100.";
    return "";
  };

  const save = async () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      if (/Question|correct|Pass mark/.test(problem)) setTab("quiz");
      return;
    }
    setError("");
    setBusy(true);
    // Drop blank options while keeping the right answer pointing at the same text
    const cleanQuiz = quiz.map((q) => {
      const keep = q.options.map((o, i) => ({ o: o.trim(), i })).filter((x) => x.o);
      return { question: q.question.trim(), options: keep.map((x) => x.o), answer: keep.findIndex((x) => x.i === q.answer), explanation: q.explanation.trim() };
    });
    const payload = { ...form, quiz: cleanQuiz, quizPassPercent: Number(passPercent) };
    try {
      const { data } = module ? await moduleApi.update(module._id, payload) : await moduleApi.create(courseId, { ...payload, moduleOrder: nextOrder });
      toast(module ? "Module saved." : "Module added.");
      onSaved(data.module);
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
      width={760}
      title={module ? `Edit module ${module.moduleOrder}` : "New module"}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save} loading={busy}>
            {module ? "Save module" : "Add module"}
          </Button>
        </>
      }
    >
      <Tabs
        className="-mt-2 mb-5"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "content", label: "Content" },
          { value: "quiz", label: "Quiz", count: quiz.length },
        ]}
      />
      {tab === "content" ? (
        <div className="space-y-4">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Input label="Summary" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} hint="One line shown in the syllabus." />
          <Textarea label="Lesson notes" rows={10} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} hint="Plain text. Line breaks are kept." />
          <Textarea
            label="Resources"
            rows={4}
            value={form.resourceLinks}
            onChange={(e) => setForm({ ...form, resourceLinks: e.target.value })}
            hint="One link per line — PDFs, videos, documentation, source code."
            placeholder={"https://developer.mozilla.org/…\nhttps://www.youtube.com/watch?v=…"}
          />
        </div>
      ) : (
        <QuizBuilder quiz={quiz} setQuiz={setQuiz} passPercent={passPercent} setPassPercent={setPassPercent} />
      )}
      {error && <Notice tone="danger" className="mt-4">{error}</Notice>}
    </Dialog>
  );
}
