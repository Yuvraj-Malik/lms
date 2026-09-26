export const RidgelineMark = ({ size = 28, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
    aria-hidden="true"
  >
    <rect width="32" height="32" rx="8" fill="#4F46E5" />
    {/* Subtle inner grid/crest lines */}
    <path
      d="M4 25L13 12L19 19L23 13L28 25"
      stroke="#818CF8"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeOpacity="0.4"
    />
    {/* Primary foreground mountain ridge - left lit facet */}
    <path
      d="M5 25L14 11L18 17L14 25H5Z"
      fill="#FFFFFF"
      fillOpacity="0.95"
    />
    {/* Primary foreground ridge - right shaded facet */}
    <path
      d="M14 11L21 21L18 25L14 25V11Z"
      fill="#C7D2FE"
      fillOpacity="0.9"
    />
    {/* Secondary background peak - left lit facet */}
    <path
      d="M17 18L22 10L24 14L21 22L17 18Z"
      fill="#EEF2FF"
      fillOpacity="0.8"
    />
    {/* Secondary background peak - right shaded facet */}
    <path
      d="M22 10L27 25H21L24 14L22 10Z"
      fill="#A5B4FC"
      fillOpacity="0.75"
    />
    {/* Sharp ridgeline summit spine */}
    <path
      d="M14 11L17 18M22 10L23.5 15"
      stroke="#312E81"
      strokeWidth="0.8"
      strokeLinecap="round"
    />
  </svg>
);

export const BrandLogo = ({
  size = 28,
  showBadge = true,
  badgeText = "LMS",
  className = "",
}) => (
  <div className={`flex items-center gap-2.5 shrink-0 ${className}`}>
    <RidgelineMark size={size} />
    <span className="text-[17px] font-bold tracking-tight text-text-primary">
      Ridgeline
    </span>
    {showBadge && (
      <span className="rounded-[4px] border border-primary-500/20 bg-primary-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-700 dark:border-primary-400/20 dark:bg-primary-600/15 dark:text-primary-400">
        {badgeText}
      </span>
    )}
  </div>
);

export default BrandLogo;
