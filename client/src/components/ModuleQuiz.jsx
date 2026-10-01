import { useState } from "react";
import { Check, X } from "lucide-react";
import { moduleApi } from "../api/endpoints.js";
import { getErrorMessage } from "../api/client.js";
import { Button, Notice, cx } from "./ui.jsx";

// Quiz is graded by the server; the browser never receives the correct answers until after submitting.
export default function ModuleQuiz({ module, onResult }) {
  const questions = module.quiz || [];
  const best = module.quizResult;
  const [mode, setMode] = useState("intro"); // intro | taking | result
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const start = () => {
    setAnswers(questions.map(() => null));
    setResult(null);
    setError("");
    setMode("taking");
  };

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const { data } = await moduleApi.submitQuiz(module._id, answers);
      setResult(data);
      setMode("result");
      onResult?.(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const answered = answers.filter((a) => a !== null).length;

  return (
    <section className="rounded-lg border border-line">
      <header className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">Knowledge check</h3>
          <p className="text-[13px] text-fg-muted">
            {questions.length} question{questions.length === 1 ? "" : "s"} · pass mark {module.quizPassPercent ?? 60}%
          </p>
        </div>
        {best && mode !== "result" && (
          <span className={cx("tabular text-[13px]", best.passed ? "text-ok" : "text-fg-muted")}>
            Best: {best.score}/{best.total}
            {best.passed ? " · passed" : ""}
          </span>
        )}
      </header>

      {mode === "intro" && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
          <p className="text-[13px] text-fg-muted">
            {best?.passed ? "You've passed this quiz. You can retake it any time." : "Pass this quiz to complete the module. You can retry as often as you like."}
          </p>
          <Button variant={best?.passed ? "secondary" : "primary"} onClick={start}>
            {best ? "Retake quiz" : "Start quiz"}
          </Button>
        </div>
      )}

      {mode === "taking" && (
        <div className="space-y-6 px-4 py-5">
          {questions.map((q, qi) => (
            <fieldset key={q._id || qi}>
              <legend className="mb-2.5 text-sm font-medium">
                <span className="tabular mr-2 text-fg-subtle">{qi + 1}.</span>
                {q.question}
              </legend>
              <div className="space-y-1.5">
                {q.options.map((opt, oi) => {
                  const selected = answers[qi] === oi;
                  return (
                    <label
                      key={oi}
                      className={cx(
                        "flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 text-sm transition-colors",
                        selected ? "border-accent bg-accent-soft" : "border-line hover:border-line-strong"
                      )}
                    >
                      <input
                        type="radio"
                        name={`q-${module._id}-${qi}`}
                        checked={selected}
                        onChange={() => setAnswers((a) => a.map((v, i) => (i === qi ? oi : v)))}
                        className="mt-[3px] accent-[var(--accent)]"
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
          {error && <Notice tone="danger">{error}</Notice>}
          <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
            <span className="tabular text-[13px] text-fg-muted">
              {answered} of {questions.length} answered
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setMode("intro")}>
                Cancel
              </Button>
              <Button variant="primary" onClick={submit} loading={busy} disabled={answered < questions.length}>
                Submit answers
              </Button>
            </div>
          </div>
        </div>
      )}

      {mode === "result" && result && (
        <div className="px-4 py-5">
          <Notice tone={result.passed ? "ok" : "warn"} title={`${result.score} of ${result.total} correct — ${result.passed ? "passed" : "not passed yet"}`}>
            {result.passed ? "This module is now marked complete." : `You need ${result.passPercent}% to pass. Review the notes and try again.`}
          </Notice>
          <ol className="mt-5 space-y-4">
            {questions.map((q, qi) => {
              const r = result.results[qi];
              return (
                <li key={q._id || qi} className="text-sm">
                  <div className="flex gap-2">
                    {r.correct ? <Check size={16} className="mt-0.5 shrink-0 text-ok" /> : <X size={16} className="mt-0.5 shrink-0 text-danger" />}
                    <span className="font-medium">{q.question}</span>
                  </div>
                  <div className="ml-6 mt-1 text-[13px] text-fg-muted">
                    {!r.correct && (
                      <div>
                        Your answer: {r.selected >= 0 ? q.options[r.selected] : "—"}
                        <br />
                      </div>
                    )}
                    Correct answer: <span className="text-fg">{q.options[r.correctAnswer]}</span>
                    {r.explanation && <div className="mt-1">{r.explanation}</div>}
                  </div>
                </li>
              );
            })}
          </ol>
          <div className="mt-5 flex justify-end">
            <Button onClick={start}>Try again</Button>
          </div>
        </div>
      )}
    </section>
  );
}
