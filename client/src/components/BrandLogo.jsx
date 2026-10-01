export const BrandMark = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" className="shrink-0">
    <rect width="32" height="32" rx="7" className="fill-accent" />
    <path d="M6 22.5 12.5 13l4 5.5 3-4 6.5 8" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const BrandLogo = ({ size = 24 }) => (
  <span className="inline-flex items-center gap-2">
    <BrandMark size={size} />
    <span className="text-[15px] font-semibold tracking-tight text-fg">Ridgeline</span>
  </span>
);

export default BrandLogo;
