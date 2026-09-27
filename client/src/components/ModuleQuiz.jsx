import React, { useState } from "react";
import { 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Award,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { Button } from "./ui.jsx";

// Curated curriculum questions by common module keywords
const CURRICULUM_BANK = {
  html: [
    {
      q: "Which HTML5 semantic element is best suited for independent, distributable content such as a blog post or news article?",
      options: ["<section>", "<article>", "<aside>", "<div>"],
      answer: 1,
      explanation: "<article> specifies self-contained content that could stand alone and be reused independently."
    },
    {
      q: "What is the primary accessibility purpose of the alt attribute on <img> elements?",
      options: ["Improves page load speed", "Provides screen readers with a text equivalent for non-sighted users", "Applies default CSS padding", "Defines the image aspect ratio"],
      answer: 1,
      explanation: "Screen readers read the alt text aloud so users who cannot see the image understand its context and purpose."
    },
    {
      q: "Which doctype declaration activates standard mode rendering in modern browsers?",
      options: ["<!DOCTYPE html>", "<!DOCTYPE HTML SYSTEM>", "<html version='5.0'>", "<!DOCTYPE standard>"],
      answer: 0,
      explanation: "<!DOCTYPE html> is the concise HTML5 standard doctype required for modern standards compliance."
    }
  ],
  css: [
    {
      q: "In Flexbox, which property aligns items along the cross-axis?",
      options: ["justify-content", "align-items", "flex-direction", "align-content"],
      answer: 1,
      explanation: "align-items controls item alignment along the cross axis, whereas justify-content aligns along the main axis."
    },
    {
      q: "How does CSS box-sizing: border-box calculate total element width?",
      options: ["content width + padding + border", "content width only, padding and border are outside", "width includes content, padding, and border", "width excludes border but includes margin"],
      answer: 2,
      explanation: "With border-box, the declared width encompasses content, padding, and border, preventing unexpected layout expansion."
    },
    {
      q: "What does the CSS selector .card > p target?",
      options: ["Any <p> descendant inside .card", "Direct child <p> elements immediately under .card", "The first sibling <p> adjacent to .card", "All paragraphs that precede .card"],
      answer: 1,
      explanation: "The child combinator (>) strictly matches elements that are direct children of the specified parent."
    }
  ],
  javascript: [
    {
      q: "What is the return value of Promise.all() when one of the input promises rejects?",
      options: ["Resolves with an array of nulls", "Immediately rejects with that rejection reason", "Ignores the error and returns fulfilled promises", "Waits for all others before rejecting"],
      answer: 1,
      explanation: "Promise.all fail-fasts: it immediately rejects upon the first rejected promise."
    },
    {
      q: "In the JavaScript Event Loop, which queue executes before the next Macro-task (e.g. setTimeout)?",
      options: ["Microtask Queue (Promises, queueMicrotask)", "Worker Thread Pool", "DOM Render Pipeline", "Call Stack Backup"],
      answer: 0,
      explanation: "Microtasks are always drained completely after the current execution context and before picking the next macrotask."
    },
    {
      q: "What will Array.prototype.map() return if no explicit return is provided inside the callback?",
      options: ["Empty array []", "Array of undefined values with identical length", "Throws a TypeError", "Array of original elements unchanged"],
      answer: 1,
      explanation: "Without an explicit return statement, JS functions return undefined, resulting in an array of undefined elements."
    }
  ],
  react: [
    {
      q: "Why must React Hook calls remain at the top level of a component?",
      options: ["To prevent memory leaks in the browser", "So React can rely on the same execution order across renders to preserve hook state", "Because JavaScript syntax forbids nested functions", "To improve Webpack compilation time"],
      answer: 1,
      explanation: "React relies on strict call order to correctly associate hook state arrays with their respective useState/useEffect calls."
    },
    {
      q: "What is the primary purpose of the dependency array in useEffect(callback, [deps])?",
      options: ["Determines which components can subscribe to the effect", "Controls whether the effect callback re-runs based on shallow prop/state changes", "Registers Redux actions automatically", "Forces the component to synchronously block rendering"],
      answer: 1,
      explanation: "React compares dependencies between renders using Object.is; if none have changed, the effect execution is skipped."
    },
    {
      q: "What key prop requirement does React enforce for list items?",
      options: ["Must be an array index", "Must be a unique and stable identifier across renders", "Must be an integer starting from 0", "Must match the component class name"],
      answer: 1,
      explanation: "Stable unique keys allow React's reconciler to track which items have been added, moved, or deleted efficiently."
    }
  ],
  backend: [
    {
      q: "What is the primary role of Express.js middleware functions?",
      options: ["Directly compile JavaScript into binary code", "Intercept request/response cycles to execute logic, modify objects, or terminate requests", "Act as a relational database driver", "Render React JSX components on the client"],
      answer: 1,
      explanation: "Middleware functions have access to req, res, and next, enabling authentication, parsing, logging, and error handling."
    },
    {
      q: "Which HTTP status code is most appropriate when a resource is successfully created?",
      options: ["200 OK", "201 Created", "204 No Content", "301 Moved Permanently"],
      answer: 1,
      explanation: "HTTP 201 Created signifies that the request succeeded and resulted in the creation of a new resource."
    },
    {
      q: "Why should sensitive JWT tokens be stored in HTTP-only cookies instead of localStorage?",
      options: ["HTTP-only cookies are inaccessible to client-side scripts, mitigating XSS token theft", "Cookies hold more bytes than localStorage", "LocalStorage does not persist after browser refresh", "Cookies automatically encrypt the token payload with AES"],
      answer: 0,
      explanation: "The httpOnly flag prevents client JavaScript (and injected malicious scripts) from accessing the cookie via document.cookie."
    }
  ],
  database: [
    {
      q: "In MongoDB, what is the primary benefit of creating an index on frequently queried fields?",
      options: ["Decreases database disk storage requirements", "Transforms document structure into a relational schema", "Drastically reduces scan operations from a collection scan (COLLSCAN) to an index scan (IXSCAN)", "Guarantees transactional rollback across replicas"],
      answer: 2,
      explanation: "Indexes organize field values in a B-Tree structure, allowing fast lookups without examining every document in the collection."
    },
    {
      q: "What does the Mongoose populate() method do?",
      options: ["Inserts dummy seed records into a collection", "Replaces specified path ObjectIds with corresponding documents from another collection", "Compiles Mongoose schema into a SQL table", "Validates required fields before saving"],
      answer: 1,
      explanation: "populate() performs reference resolution similar to a left-outer join, querying referenced collections to hydrate related documents."
    },
    {
      q: "Which MongoDB aggregation pipeline stage is used to filter documents before grouping?",
      options: ["$project", "$match", "$group", "$filter"],
      answer: 1,
      explanation: "$match filters documents to pass only those matching specified conditions to the subsequent pipeline stages."
    }
  ],
  default: [
    {
      q: "In software engineering, what is the primary objective of automated unit testing?",
      options: ["To replace manual user acceptance testing entirely", "To verify that isolated units of code execute as expected and protect against regressions", "To measure network latency across microservices", "To format source code according to style guides"],
      answer: 1,
      explanation: "Unit tests isolate individual functions or classes to verify their correctness and catch regressions early."
    },
    {
      q: "Which Git command creates a new branch and switches to it in one step?",
      options: ["git branch -new", "git checkout -b <branch_name>", "git switch --create-merge", "git commit -b"],
      answer: 1,
      explanation: "git checkout -b <name> (or git switch -c <name>) creates the branch and updates HEAD to point to it."
    },
    {
      q: "What is the key principle behind Clean Architecture and Separation of Concerns?",
      options: ["Writing all code in a single file to reduce imports", "Decoupling business logic from frameworks, UI, and external database implementations", "Using only functional programming without classes", "Maximizing global mutable variables"],
      answer: 1,
      explanation: "Separation of concerns ensures business logic remains independent of UI, database, or external framework details."
    }
  ]
};

function getQuestionsForModule(module) {
  if (module?.quiz && Array.isArray(module.quiz) && module.quiz.length > 0) {
    return module.quiz.map((q) => ({
      q: q.q || q.question,
      options: q.options || [],
      answer: typeof q.answer === "number" ? q.answer : 0,
      explanation: q.explanation || "",
    }));
  }

  const titleLower = (module?.title || "").toLowerCase();
  const descLower = (module?.description || "").toLowerCase();
  const combined = `${titleLower} ${descLower}`;

  if (combined.includes("html")) return CURRICULUM_BANK.html;
  if (combined.includes("css") || combined.includes("style") || combined.includes("tailwind")) return CURRICULUM_BANK.css;
  if (combined.includes("javascript") || combined.includes("es6") || combined.includes("js")) return CURRICULUM_BANK.javascript;
  if (combined.includes("react") || combined.includes("frontend") || combined.includes("component")) return CURRICULUM_BANK.react;
  if (combined.includes("backend") || combined.includes("node") || combined.includes("express") || combined.includes("api")) return CURRICULUM_BANK.backend;
  if (combined.includes("database") || combined.includes("mongo") || combined.includes("sql") || combined.includes("data")) return CURRICULUM_BANK.database;

  return CURRICULUM_BANK.default;
}

export default function ModuleQuiz({ module, onPassed, isCompleted }) {
  const questions = getQuestionsForModule(module);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (qIndex, oIndex) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [qIndex]: oIndex
    }));
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.answer) score++;
    });
    return score;
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const score = calculateScore();
    if (score >= Math.ceil(questions.length * 0.6) && onPassed) {
      onPassed();
    }
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setSubmitted(false);
  };

  const allAnswered = Object.keys(selectedAnswers).length === questions.length;
  const score = calculateScore();
  const passed = score >= Math.ceil(questions.length * 0.6);

  return (
    <div className="rounded-[10px] border border-border-subtle bg-bg-surface-raised/40 p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-primary-600/10 text-primary-400">
            <HelpCircle size={15} />
          </div>
          <div>
            <h3 className="type-h3 text-text-primary text-sm font-semibold">
              Module Knowledge Check
            </h3>
            <p className="type-caption text-text-tertiary">
              {questions.length} questions to verify conceptual comprehension
            </p>
          </div>
        </div>

        {submitted && (
          <span
            className={`rounded-sm px-2 py-0.5 type-caption font-bold ${
              passed
                ? "bg-semantic-success/15 text-semantic-success"
                : "bg-semantic-warning/15 text-semantic-warning"
            }`}
          >
            {score} / {questions.length} Correct ({Math.round((score / questions.length) * 100)}%)
          </span>
        )}
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((item, qIndex) => {
          const isSelected = selectedAnswers[qIndex] !== undefined;
          const isCorrect = submitted && selectedAnswers[qIndex] === item.answer;
          const isWrong = submitted && isSelected && selectedAnswers[qIndex] !== item.answer;

          return (
            <div
              key={qIndex}
              className="rounded-[8px] border border-border-subtle bg-bg-surface p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="type-body font-medium text-text-primary">
                  <span className="text-text-tertiary mr-1.5">{qIndex + 1}.</span>
                  {item.q}
                </p>
                {submitted && (
                  <span className="shrink-0 mt-0.5">
                    {isCorrect ? (
                      <CheckCircle2 size={16} className="text-semantic-success" />
                    ) : (
                      <XCircle size={16} className="text-semantic-danger" />
                    )}
                  </span>
                )}
              </div>

              {/* Options */}
              <div className="grid gap-2">
                {item.options.map((option, oIndex) => {
                  const active = selectedAnswers[qIndex] === oIndex;
                  let optionClass =
                    "border-border-subtle bg-bg-surface-raised hover:bg-bg-surface-raised/80 text-text-secondary";

                  if (active && !submitted) {
                    optionClass =
                      "border-primary-500 bg-primary-600/10 text-text-primary font-medium";
                  }

                  if (submitted) {
                    if (oIndex === item.answer) {
                      optionClass =
                        "border-semantic-success bg-semantic-success/10 text-semantic-success font-medium";
                    } else if (active && oIndex !== item.answer) {
                      optionClass =
                        "border-semantic-danger bg-semantic-danger/10 text-semantic-danger";
                    } else {
                      optionClass = "border-border-subtle opacity-50";
                    }
                  }

                  return (
                    <button
                      key={oIndex}
                      type="button"
                      disabled={submitted}
                      onClick={() => handleSelect(qIndex, oIndex)}
                      className={`flex w-full items-center text-left rounded-[6px] border px-3.5 py-2.5 type-body-sm transition-all ${optionClass}`}
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[11px] mr-2.5 opacity-80">
                        {String.fromCharCode(65 + oIndex)}
                      </span>
                      <span className="flex-1">{option}</span>
                    </button>
                  );
                })}
              </div>

              {/* Explanation upon submission */}
              {submitted && item.explanation && (
                <div className="rounded-[6px] bg-bg-surface-raised/70 p-2.5 border-l-2 border-primary-500 type-body-sm text-text-secondary mt-2">
                  <strong className="text-text-primary font-semibold">Explanation: </strong>
                  {item.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        {!submitted ? (
          <Button
            size="sm"
            variant="primary"
            disabled={!allAnswered}
            onClick={handleSubmit}
            className="gap-1.5"
          >
            <Sparkles size={14} />
            Submit Knowledge Check
          </Button>
        ) : (
          <div className="flex items-center justify-between w-full">
            <p className="type-body-sm text-text-secondary">
              {passed
                ? "Knowledge validated. You can proceed with marking this module complete."
                : "Review the explanations above and retry to solidify your understanding."}
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleReset}
              className="gap-1.5 shrink-0"
            >
              <RotateCcw size={13} />
              Retake Quiz
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
