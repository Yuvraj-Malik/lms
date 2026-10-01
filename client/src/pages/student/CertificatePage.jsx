import { useParams } from "react-router-dom";
import { Printer, Copy } from "lucide-react";
import { userApi } from "../../api/endpoints.js";
import useAsync from "../../lib/useAsync.js";
import Certificate from "../../components/Certificate.jsx";
import { Button, ErrorState, PageHeader, PageLoader, useFeedback } from "../../components/ui.jsx";

export default function CertificatePage() {
  const { enrollmentId } = useParams();
  const { toast } = useFeedback();
  const { data, loading, error, reload } = useAsync(async () => (await userApi.profile()).data.certificates, []);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const cert = data.find((c) => c.enrollmentId === enrollmentId);
  if (!cert) return <ErrorState message="This certificate isn't available. Complete every module in the course first." />;

  const verifyUrl = `${window.location.origin}/verify/${cert.id}`;
  return (
    <>
      <div className="no-print">
        <PageHeader
          back={{ to: "/dashboard/profile", label: "Profile" }}
          title={cert.courseTitle}
          description="Print it, save it as a PDF, or share the verification link."
          actions={
            <>
              <Button
                icon={Copy}
                onClick={() =>
                  navigator.clipboard?.writeText(verifyUrl).then(
                    () => toast("Verification link copied."),
                    () => toast("Couldn't copy the link.", "danger")
                  )
                }
              >
                Copy verify link
              </Button>
              <Button icon={Printer} variant="primary" onClick={() => window.print()}>
                Print or save PDF
              </Button>
            </>
          }
        />
      </div>
      <div className="print-only-root">
        <Certificate cert={cert} />
      </div>
    </>
  );
}
