export function ProgressBar({ value, max = 100, height = 8 }: { value: number; max?: number; height?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="progress-track w-full" style={{ height }}>
      <div className="progress-fill h-full" style={{ width: `${pct}%` }} />
    </div>
  );
}
