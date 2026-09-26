import { ShieldCheck, Award, Printer, CheckCircle } from "lucide-react";
import { Button } from "./ui.jsx";

export const CertificateSeal = ({ size = 64, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
    aria-hidden="true"
  >
    {/* Outer decorative teeth */}
    <circle cx="40" cy="40" r="38" stroke="#4F46E5" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
    <circle cx="40" cy="40" r="34" stroke="#818CF8" strokeWidth="1" opacity="0.4" />
    <circle cx="40" cy="40" r="30" fill="#4F46E5" fillOpacity="0.08" stroke="#4F46E5" strokeWidth="1.5" />
    {/* Inner crest ring */}
    <circle cx="40" cy="40" r="23" stroke="#4F46E5" strokeWidth="1" strokeDasharray="2 2" />
    {/* Geometric mountain ridge crest in seal */}
    <path
      d="M28 47L37 34L42 41L45 37L52 47H28Z"
      fill="#4F46E5"
      fillOpacity="0.85"
    />
    <path
      d="M37 34L42 41L40 47H35L37 34Z"
      fill="#818CF8"
      fillOpacity="0.9"
    />
    {/* Seal star dots */}
    <circle cx="40" cy="22" r="1.5" fill="#4F46E5" />
    <circle cx="40" cy="58" r="1.5" fill="#4F46E5" />
    <circle cx="22" cy="40" r="1.5" fill="#4F46E5" />
    <circle cx="58" cy="40" r="1.5" fill="#4F46E5" />
  </svg>
);

export const CertificateDocument = ({ cert, className = "" }) => {
  if (!cert) return null;

  const formattedDate = cert.issueDate
    ? new Date(cert.issueDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "September 2026";

  return (
    <div
      className={`relative w-full aspect-[1.4/1] max-w-3xl overflow-hidden rounded-[16px] border border-border-subtle bg-bg-surface p-6 sm:p-10 shadow-card ${className}`}
    >
      {/* Double line rule: outer edge + 2px inner primary rule */}
      <div className="absolute inset-3 sm:inset-4 rounded-[12px] border-2 border-primary-600/30 dark:border-primary-500/30 pointer-events-none" />
      <div className="absolute inset-4 sm:inset-5 rounded-[10px] border border-border-subtle pointer-events-none" />

      {/* Subtle institutional background watermark */}
      <div className="absolute -right-8 -top-8 w-48 h-48 opacity-[0.03] dark:opacity-[0.06] pointer-events-none">
        <CertificateSeal size={192} />
      </div>

      <div className="relative z-10 flex h-full flex-col justify-between text-center">
        {/* Header Institution Line */}
        <div>
          <div className="flex items-center justify-center gap-2">
            <span className="h-px w-8 bg-border-default" />
            <p className="type-caption text-text-tertiary">
              Ridgeline Academic Credential
            </p>
            <span className="h-px w-8 bg-border-default" />
          </div>
          <p className="mt-1 text-xs font-semibold tracking-wider uppercase text-primary-600 dark:text-primary-400">
            Certificate of Completion
          </p>
        </div>

        {/* Body Content */}
        <div className="my-auto py-2">
          <p className="type-body-sm text-text-secondary">
            This document certifies that
          </p>
          <h1 className="mt-2.5 type-display text-text-primary tracking-tight">
            {cert.studentName}
          </h1>
          <p className="mt-2 type-body-sm text-text-secondary">
            has completed all curricular modules and examination requirements for
          </p>
          <h2 className="mt-1.5 type-h3 text-primary-600 dark:text-primary-400">
            {cert.courseTitle}
          </h2>
        </div>

        {/* Footer Metadata & Seal */}
        <div className="flex items-end justify-between border-t border-border-subtle pt-4 sm:pt-6 text-left">
          <div className="space-y-0.5">
            <p className="type-caption text-text-tertiary">Issued Date</p>
            <p className="type-body-sm font-medium text-text-primary">{formattedDate}</p>
            <p className="mt-1 text-[11px] text-text-secondary flex items-center gap-1">
              <ShieldCheck size={13} className="text-emerald-500 shrink-0" />
              Verified Authenticated Record
            </p>
          </div>

          {/* Official Corner Seal */}
          <div className="flex flex-col items-center">
            <CertificateSeal size={52} className="sm:w-16 sm:h-16" />
            <span className="mt-1 text-[9px] font-bold tracking-widest uppercase text-text-tertiary">
              Official Seal
            </span>
          </div>

          <div className="space-y-0.5 text-right">
            <p className="type-caption text-text-tertiary">Credential ID</p>
            <p className="font-mono text-xs font-medium text-text-primary">{cert.id}</p>
            <p className="mt-1 text-[11px] text-text-secondary">
              Curriculum 100% Passed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CertificateCard = ({ cert, onPrint }) => {
  const formattedDate = cert.issueDate
    ? new Date(cert.issueDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <div className="flex flex-col rounded-[16px] border border-border-subtle bg-bg-surface shadow-card overflow-hidden transition-all duration-200 hover:border-border-default hover:shadow-raised">
      {/* Scaled Preview Document */}
      <div className="relative aspect-[1.4/1] w-full overflow-hidden border-b border-border-subtle bg-bg-surface-raised p-5 sm:p-6 flex flex-col justify-between">
        {/* Double line rule */}
        <div className="absolute inset-2.5 rounded-[10px] border border-primary-600/30 pointer-events-none" />

        <div className="flex items-center justify-between">
          <span className="type-caption text-text-tertiary">
            Ridgeline Credential
          </span>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle size={12} />
            Verified
          </div>
        </div>

        <div className="my-auto text-center">
          <p className="type-display text-text-primary truncate">
            {cert.studentName}
          </p>
          <p className="mt-1 type-h3 text-primary-600 dark:text-primary-400 truncate">
            {cert.courseTitle}
          </p>
        </div>

        <div className="flex items-center justify-between text-left">
          <div>
            <p className="type-caption text-text-tertiary">Date</p>
            <p className="type-body-sm font-medium text-text-primary">{formattedDate}</p>
          </div>
          <CertificateSeal size={36} />
          <div className="text-right">
            <p className="type-caption text-text-tertiary">Credential ID</p>
            <p className="font-mono text-[11px] text-text-secondary">{cert.id}</p>
          </div>
        </div>
      </div>

      {/* Card Action Bar */}
      <div className="flex items-center justify-between p-4 bg-bg-surface">
        <span className="type-body-sm text-text-secondary">
          100% Curriculum Completed
        </span>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onPrint(cert)}
          className="gap-1.5"
        >
          <Printer size={14} />
          View Document
        </Button>
      </div>
    </div>
  );
};
