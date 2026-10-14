export function Line({ values, unit, goal }: { values: number[]; unit: string; goal?: number }) {
  if (values.length < 2) return <p className="py-6 text-center text-sm text-[var(--mute)]">Log at least two entries to see a trend.</p>;
  const all = goal ? [...values, goal] : values, lo = Math.min(...all), hi = Math.max(...all), r = hi - lo || 1;
  const y = (v: number) => 90 - ((v - lo) / r) * 70, x = (i: number) => 10 + (i / (values.length - 1)) * 280;
  return (
    <svg viewBox="0 0 300 110" className="w-full" role="img" aria-label={`Trend from ${values[0]} to ${values.at(-1)} ${unit}`}>
      {goal != null && <line x1="10" x2="290" y1={y(goal)} y2={y(goal)} stroke="var(--mute)" strokeDasharray="4 4" />}
      <polyline fill="none" stroke="var(--acc)" strokeWidth="2.5" strokeLinejoin="round" points={values.map((v, i) => `${x(i)},${y(v)}`).join(" ")} />
      <circle cx={x(values.length - 1)} cy={y(values.at(-1)!)} r="4" fill="var(--acc)" />
      <text x="10" y="107" fontSize="10" fill="var(--mute)">{lo} {unit}</text><text x="290" y="107" fontSize="10" textAnchor="end" fill="var(--mute)">{hi} {unit}</text>
    </svg>);
}
export function Bars({ values, target }: { values: number[]; target: number }) {
  const hi = Math.max(target, ...values, 1);
  return (
    <div className="flex h-24 items-end gap-1" role="img" aria-label="Bottles per day">
      {values.map((v, i) => <div key={i} className="flex-1 rounded-sm" style={{ height: `${Math.max(4, (v / hi) * 100)}%`, background: v >= target ? "var(--acc)" : "var(--line)" }} />)}
    </div>);
}
export function Ring({ pct, label }: { pct: number; label: string }) {
  const p = Math.max(0, Math.min(100, Math.round(pct))), c = 2 * Math.PI * 28;
  return (<svg width="72" height="72" viewBox="0 0 72 72" role="img" aria-label={`${label}: ${p}%`}><circle cx="36" cy="36" r="28" fill="none" stroke="var(--card2)" strokeWidth="7" />
    <circle cx="36" cy="36" r="28" fill="none" stroke="var(--acc)" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${(p / 100) * c} ${c}`} transform="rotate(-90 36 36)" /><text x="36" y="40" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--ink)">{p}%</text></svg>);
}
