import { BrandMark } from "./BrandLogo.jsx";
import { fmtDate } from "../lib/format.js";

// A printable certificate. Sized in A4-landscape proportions; scales to its container.
export default function Certificate({ cert }) {
  const verifyUrl = `${window.location.origin}/verify/${cert.id}`;
  return (
    <div className="mx-auto aspect-[297/210] w-full max-w-[900px] bg-white text-[#1b1c1a] shadow-[0_0_0_1px_#e4e4df] print:max-w-none print:shadow-none">
      <div className="flex h-full flex-col justify-between border-[10px] border-[#f1f1ee] p-[6%]">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-sm font-semibold">
            <BrandMark size={22} /> Ridgeline
          </span>
          <span className="font-mono text-[11px] text-[#5f625c]">{cert.id}</span>
        </div>

        <div>
          <p className="text-[13px] uppercase tracking-[0.18em] text-[#5f625c]">Certificate of completion</p>
          <p className="mt-[3%] text-[clamp(26px,4.4vw,44px)] font-semibold leading-tight tracking-[-0.02em]">{cert.studentName}</p>
          <p className="mt-[2%] max-w-[80%] text-[clamp(13px,1.6vw,16px)] leading-relaxed text-[#5f625c]">
            has completed every module of <span className="font-medium text-[#1b1c1a]">{cert.courseTitle}</span>
            {cert.duration ? `, a ${cert.duration.toLowerCase()} course` : ""} in {cert.category || cert.courseCategory}.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6 border-t border-[#e4e4df] pt-[3%] text-[12px]">
          <div>
            <div className="text-[#8b8e86]">Issued</div>
            <div className="mt-0.5 font-medium">{fmtDate(cert.issueDate)}</div>
          </div>
          <div>
            <div className="text-[#8b8e86]">Instructor</div>
            <div className="mt-0.5 font-medium">{cert.instructor}</div>
          </div>
          <div>
            <div className="text-[#8b8e86]">Verify at</div>
            <div className="mt-0.5 break-all font-mono text-[11px]">{verifyUrl.replace(/^https?:\/\//, "")}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
