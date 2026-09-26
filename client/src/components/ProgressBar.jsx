const ProgressBar = ({ value = 0, showLabel = true, className = "" }) => (
  <div className={className}>
    <div className="trail-track">
      <div className="trail-fill" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
    {showLabel && (
      <div className="mt-1 flex justify-between type-caption text-text-secondary">
        <span>Progress</span>
        <span>{value}%</span>
      </div>
    )}
  </div>
);

export default ProgressBar;
