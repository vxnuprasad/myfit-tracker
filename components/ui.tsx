"use client";
import { useEffect, useId, useState } from "react";
import { Sun, X } from "lucide-react";
import { Mountains } from "./art";

export const fmtN = (n: number) => Math.round(n).toLocaleString("en-US");
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const dt = (ds: string) => new Date(ds + "T12:00:00");
export const fmtShort = (ds: string) => `${dt(ds).getDate()} ${MON[dt(ds).getMonth()]}`;
export const fmtLong = (ds: string) => { const d = dt(ds); return `${DOW[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`; };
export const addDays = (n: number, from = new Date()) => { const d = new Date(from); d.setDate(d.getDate() + n); return d.toLocaleDateString("en-CA"); };
/** "Hybrid Push" -> "Push", "Quad-focused Legs" -> "Legs", "Upper Body" -> "Upper". */
export const shortDay = (name: string) => { const w = name.trim().split(/\s+/); return /^body$/i.test(w.at(-1) || "") && w.length > 1 ? w[0] : w.at(-1) || name; };

export function Ring({ pct, size = 96, stroke = 10, from = "#FF8A4C", to = "#FF4A12", track = "#FFE8DA", label, children }:
  { pct: number; size?: number; stroke?: number; from?: string; to?: string; track?: string; label: string; children?: React.ReactNode }) {
  const id = useId().replace(/:/g, ""), p = Math.max(0, Math.min(100, pct || 0)), r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${label}: ${Math.round(p)}%`}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={from} /><stop offset="1" stopColor={to} /></linearGradient></defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        {p > 0 && <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${id})`} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${(p / 100) * c} ${c}`} style={{ transition: "stroke-dasharray .6s ease" }} />}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function Meter({ pct, from, to, track, h = 6, label, now, max }: { pct: number; from: string; to: string; track: string; h?: number; label: string; now?: number; max?: number }) {
  const p = Math.max(0, Math.min(100, pct || 0));
  return (
    <div className="overflow-hidden rounded-full" style={{ height: h, background: track }} role="progressbar" aria-label={label} aria-valuenow={Math.round(now ?? p)} aria-valuemin={0} aria-valuemax={Math.round(max ?? 100)}>
      <div className="h-full rounded-full" style={{ width: `${p}%`, background: `linear-gradient(90deg, ${from}, ${to})`, transition: "width .6s ease" }} />
    </div>
  );
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = prev; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-label="Close dialog" className="absolute inset-0 bg-[#2a1608]/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="sheet relative max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-t-[28px] bg-[var(--bg)] p-5 shadow-2xl sm:rounded-[28px]" style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}>
        <div className="mb-4 flex items-center justify-between gap-3"><h2 className="num text-xl">{title}</h2>
          <button className="icon-btn !h-10 !w-10 !rounded-xl" aria-label="Close" onClick={onClose}><X size={20} /></button></div>
        {children}
      </div>
    </div>
  );
}

/** Floating note card with a sun icon, used over the mountain header. */
export function SunNote({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex gap-2 rounded-[22px] border border-white/80 bg-white/75 p-3 shadow-[var(--shadow)] backdrop-blur-md ${className}`}>
      <Sun size={22} className="mt-0.5 shrink-0 text-[var(--acc)]" aria-hidden /><p className="text-[12.5px] font-medium leading-snug">{children}</p>
    </div>
  );
}

/** Page header with big title + subtitle. `mountains` adds the sunrise illustration behind it. */
export function PageHead({ title, sub, right, mountains, note }: { title: string; sub: string; right?: React.ReactNode; mountains?: boolean; note?: React.ReactNode }) {
  return (
    <header className="relative -mx-4 px-4 pb-1">
      {mountains && <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-[calc(1rem+env(safe-area-inset-top))] h-[230px] overflow-hidden [mask-image:linear-gradient(to_bottom,#000_62%,transparent)]">
        <Mountains className="absolute right-0 top-0 h-full w-full" /><div className="absolute inset-0 bg-gradient-to-r from-[var(--bg)] via-[var(--bg)]/40 to-transparent" /></div>}
      {note ? (
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0"><h1 className="num text-[40px] leading-[1.05] tracking-tight">{title}</h1><p className="mt-1 text-[15px] font-medium text-[var(--mute)]">{sub}</p></div>
          <SunNote className="mt-1 w-[38%] shrink-0">{note}</SunNote>
        </div>
      ) : (
        <div className="relative">
          <div className="flex items-center justify-between gap-2"><h1 className="num text-[36px] leading-[1.05] tracking-tight min-[400px]:text-[40px]">{title}</h1>{right && <div className="flex shrink-0 gap-2">{right}</div>}</div>
          <p className="mt-0.5 text-[15px] font-medium text-[var(--mute)]">{sub}</p>
        </div>
      )}
    </header>
  );
}

/** Numeric field that keeps its own text so "80." and "" can be typed; commits parsed value on every valid change. */
export function NumField({ label, unit, value, onCommit, decimal, hint }: { label: string; unit?: string; value?: number; onCommit: (v?: number) => void; decimal?: boolean; hint?: string }) {
  const [s, setS] = useState(value == null ? "" : String(value));
  useEffect(() => { if ((parseFloat(s) || undefined) !== value) setS(value == null ? "" : String(value)); }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <label className="block"><span className="lbl">{label}{unit ? ` (${unit})` : ""}</span>
      <input className="inp mt-1" inputMode={decimal ? "decimal" : "numeric"} value={s} placeholder="Not set"
        onChange={e => { const v = e.target.value; if (!(decimal ? /^\d*\.?\d*$/ : /^\d*$/).test(v)) return; setS(v); const n = parseFloat(v); onCommit(Number.isFinite(n) ? n : undefined); }} />
      {hint && <span className="mt-1 block text-xs text-[var(--mute)]">{hint}</span>}
    </label>
  );
}
