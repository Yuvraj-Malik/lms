import { usePlatform } from "../context/PlatformContext.jsx";
import { cx } from "./ui.jsx";

const TONE = {
  info: "bg-info-soft text-info",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
  ok: "bg-ok-soft text-ok",
};

// Platform-wide message set by the super admin in Platform settings
export default function SiteBanner() {
  const { platform } = usePlatform();
  if (!platform.banner) return null;
  return (
    <div role="status" className={cx("no-print border-b border-line px-4 py-2 text-center text-[13px] font-medium", TONE[platform.banner.tone] || TONE.info)}>
      {platform.banner.message}
    </div>
  );
}
