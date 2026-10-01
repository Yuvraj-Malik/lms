import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";
import { enrollmentApi } from "../../api/endpoints.js";
import { getErrorMessage } from "../../api/client.js";
import useAsync from "../../lib/useAsync.js";
import { fmtDate } from "../../lib/format.js";
import { Button, Input, Spinner } from "../../components/ui.jsx";

export default function VerifyCertificate() {
  const { credentialId } = useParams();
  const navigate = useNavigate();
  const [value, setValue] = useState(credentialId || "");

  const result = useAsync(async () => {
    if (!credentialId) return null;
    try {
      return (await enrollmentApi.verify(credentialId)).data;
    } catch (err) {
      return { valid: false, message: getErrorMessage(err) };
    }
  }, [credentialId]);

  const submit = (e) => {
    e.preventDefault();
    if (value.trim()) navigate(`/verify/${value.trim()}`);
  };

  const r = result.data;
  return (
    <div className="mx-auto max-w-[560px] px-4 py-16">
      <h1 className="text-[26px] font-semibold tracking-tight">Verify a certificate</h1>
      <p className="mt-1.5 text-sm text-fg-muted">Enter the certificate ID printed in the top-right corner, e.g. RDG-6650F2…</p>
      <form onSubmit={submit} className="mt-6 flex gap-2">
        <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="RDG-…" className="flex-1" inputClassName="font-mono" aria-label="Certificate ID" />
        <Button type="submit" variant="primary">
          Verify
        </Button>
      </form>

      {credentialId && (
        <div className="mt-8 rounded-lg border border-line bg-surface p-5">
          {result.loading ? (
            <Spinner />
          ) : r?.valid ? (
            <>
              <div className="flex items-center gap-2 text-sm font-medium text-ok">
                <CheckCircle2 size={17} /> Valid certificate
              </div>
              <dl className="mt-4 space-y-2.5 text-sm">
                {[
                  ["Awarded to", r.cert.studentName],
                  ["Course", r.cert.courseTitle],
                  ["Category", r.cert.courseCategory],
                  ["Instructor", r.cert.instructor],
                  ["Issued", fmtDate(r.cert.issueDate)],
                  ["Certificate ID", <span className="font-mono text-[13px]">{r.cert.id}</span>],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-6">
                    <dt className="text-fg-muted">{k}</dt>
                    <dd className="m-0 text-right">{v}</dd>
                  </div>
                ))}
              </dl>
            </>
          ) : (
            <div className="flex items-start gap-2 text-sm">
              <XCircle size={17} className="mt-px shrink-0 text-danger" />
              <div>
                <div className="font-medium text-fg">Not a valid certificate</div>
                <div className="mt-0.5 text-fg-muted">{r?.message}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
