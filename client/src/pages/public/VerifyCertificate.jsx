import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  ShieldCheck, 
  Printer, 
  Copy, 
  Check, 
  ArrowLeft, 
  ExternalLink,
  Award,
  AlertTriangle 
} from "lucide-react";
import { enrollmentApi } from "../../api/endpoints.js";
import { getErrorMessage } from "../../api/client.js";
import { CertificateDocument, CertificateSeal } from "../../components/Certificate.jsx";
import { Card, Button, Spinner, StatusBadge } from "../../components/ui.jsx";
import BrandLogo, { RidgelineMark } from "../../components/BrandLogo.jsx";

export default function VerifyCertificate() {
  const { credentialId } = useParams();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchVerification = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await enrollmentApi.verify(credentialId);
        if (res.data?.valid && res.data?.cert) {
          setCert(res.data.cert);
        } else {
          setError(res.data?.message || "Invalid or unverified credential ID.");
        }
      } catch (err) {
        setError(
          getErrorMessage(err) ||
            "Unable to verify credential. Please confirm the credential ID or contact the institution registry."
        );
      } finally {
        setLoading(false);
      }
    };

    if (credentialId) {
      fetchVerification();
    }
  }, [credentialId]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Spinner size={32} />
        <p className="type-body text-text-secondary">
          Consulting Ridgeline Academic Credential Registry…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base py-10 px-4 sm:px-6 print:p-0 print:bg-white">
      {/* Non-print Top Navigation */}
      <div className="mx-auto max-w-4xl print:hidden">
        <div className="flex items-center justify-between border-b border-border-subtle pb-5">
          <Link to="/" className="inline-flex items-center gap-2">
            <BrandLogo size={24} />
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button size="sm" variant="ghost">
                Portal Login
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl mt-8 space-y-8">
        {error ? (
          <Card className="p-8 text-center max-w-lg mx-auto print:hidden space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-semantic-danger/10 text-semantic-danger">
              <AlertTriangle size={24} />
            </div>
            <h1 className="type-h2 text-text-primary">
              Credential Verification Failed
            </h1>
            <p className="type-body text-text-secondary">
              {error}
            </p>
            <div className="pt-2">
              <Link to="/">
                <Button variant="secondary" size="sm">
                  Return to Ridgeline Portal
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <>
            {/* Verification Status Header */}
            <div className="print:hidden space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-bg-surface p-5 rounded-[12px] border border-border-subtle shadow-card">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-semantic-success/10 text-semantic-success">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="type-caption text-text-tertiary">
                        Official Verification Registry
                      </span>
                      <span className="rounded-sm bg-semantic-success/15 px-1.5 py-0.5 type-caption font-bold text-semantic-success uppercase">
                        Active & Valid
                      </span>
                    </div>
                    <p className="type-h3 text-text-primary mt-0.5">
                      Authentic Academic Credential Verified
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyLink}
                    className="gap-1.5"
                  >
                    {copied ? <Check size={14} className="text-semantic-success" /> : <Copy size={14} />}
                    {copied ? "Link Copied" : "Share Record"}
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handlePrint}
                    className="gap-1.5"
                  >
                    <Printer size={14} />
                    Print / Save PDF
                  </Button>
                </div>
              </div>
            </div>

            {/* The Certificate Document Component */}
            <div className="flex justify-center print:w-full print:m-0">
              <CertificateDocument cert={cert} className="shadow-raised print:shadow-none print:border-none" />
            </div>

            {/* Credential Metadata Breakdown */}
            <Card className="p-6 print:hidden">
              <h2 className="type-h3 text-text-primary mb-4 flex items-center gap-2">
                <Award size={16} className="text-primary-600 dark:text-primary-400" />
                Registry Record Summary
              </h2>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-[8px] border border-border-subtle bg-bg-surface-raised p-3.5">
                  <p className="type-caption text-text-tertiary">Recipient</p>
                  <p className="type-body font-semibold text-text-primary mt-0.5">
                    {cert.studentName}
                  </p>
                </div>

                <div className="rounded-[8px] border border-border-subtle bg-bg-surface-raised p-3.5">
                  <p className="type-caption text-text-tertiary">Course Completed</p>
                  <p className="type-body font-semibold text-text-primary mt-0.5">
                    {cert.courseTitle}
                  </p>
                </div>

                <div className="rounded-[8px] border border-border-subtle bg-bg-surface-raised p-3.5">
                  <p className="type-caption text-text-tertiary">Credential Identifier</p>
                  <p className="font-mono text-xs font-semibold text-primary-500 mt-1">
                    {cert.id}
                  </p>
                </div>

                <div className="rounded-[8px] border border-border-subtle bg-bg-surface-raised p-3.5">
                  <p className="type-caption text-text-tertiary">Issuing Authority</p>
                  <p className="type-body font-semibold text-text-primary mt-0.5 truncate">
                    {cert.institution}
                  </p>
                </div>
              </div>

              <div className="mt-5 border-t border-border-subtle pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 type-caption text-text-tertiary">
                <p>
                  Verified on {new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })} via Ridgeline Cryptographic Verification API
                </p>
                <p>
                  Curriculum Modules Completed: {cert.completedModules || "All"}
                </p>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
