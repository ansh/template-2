interface ProgressProps {
  value: number;
  className?: string;
  indicatorClassName?: string;
}

export function Progress({
  value,
  className = "",
  indicatorClassName = "",
}: ProgressProps) {
  return (
    <div className={`relative w-full overflow-hidden rounded-full ${className}`}>
      <div
        className={`h-full transition-all duration-300 ${indicatorClassName}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
} 