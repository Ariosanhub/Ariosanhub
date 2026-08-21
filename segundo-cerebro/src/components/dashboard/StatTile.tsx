export function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-[var(--fg-muted)]">{label}</p>
    </div>
  );
}
