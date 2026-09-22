const ProgressBar = ({ value = 0, showLabel = true, className = "" }) => (
  <div className={className}>
    <div className="trail-track">
      <div className="trail-fill" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
    {showLabel && (
      <div className="mt-1 flex justify-between text-xs text-ink-soft dark:text-dark-ink-soft">
        <span>Progress</span>
        <span>{value}%</span>
      </div>
    )}
  </div>
);

export default ProgressBar;
