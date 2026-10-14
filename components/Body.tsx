"use client";
import { useState } from "react";
import { DB } from "@/lib/types";
import { today } from "@/lib/store";
import { Line, Bars } from "./Charts";
import { Droplet } from "lucide-react";
import { Ring } from "./ui";
type Upd = (f: (d: DB) => DB, k: (keyof DB)[]) => void;
const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
const f1 = (n: number) => (Number.isFinite(n) ? n.toFixed(1) : "Not recorded");
export const sortedWeight = (db: DB) => [...db.weight].sort((a, b) => a.date.localeCompare(b.date));

export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return <div className="card !p-3"><p className="lbl">{label}</p><p className="num text-2xl">{value}</p>{sub && <p className="text-xs text-[var(--mute)]">{sub}</p>}</div>;
}

export function Weight({ db, update }: { db: DB; update: Upd }) {
  const [open, setOpen] = useState(false); const [kg, setKg] = useState(""); const [waist, setWaist] = useState("");
  const w = sortedWeight(db), cur = w.at(-1)?.kg;
  const last7 = w.slice(-7).map(x => x.kg);
  return (
    <div className="space-y-3">
      <div className="card"><p className="lbl">Current weight</p><p className="num text-5xl">{cur ?? "–"}<span className="text-xl text-[var(--mute)]"> kg</span></p>
        {cur != null && <p className="text-sm text-[var(--mute)]">{(cur - db.profile.startKg).toFixed(1)} kg since start · {(cur - db.profile.goalKg).toFixed(1)} kg to goal</p>}</div>
      <div className="grid grid-cols-3 gap-2"><Stat label="Start" value={String(db.profile.startKg)} /><Stat label="Goal" value={String(db.profile.goalKg)} /><Stat label="7-day avg" value={Number.isFinite(avg(last7)) ? f1(avg(last7)) : "–"} /></div>
      <div className="card"><p className="lbl mb-1">Trend</p><Line values={w.slice(-30).map(x => x.kg)} unit="kg" goal={db.profile.goalKg} /></div>
      {open ? (
        <div className="card space-y-3"><label className="lbl block">Weight (kg)<input className="inp mt-1" inputMode="decimal" autoFocus value={kg} onChange={e => setKg(e.target.value)} /></label>
          <label className="lbl block">Waist (cm, optional)<input className="inp mt-1" inputMode="decimal" value={waist} onChange={e => setWaist(e.target.value)} /></label>
          <div className="flex gap-2"><button className="btn" onClick={() => { const v = parseFloat(kg); if (!(v > 20 && v < 400)) return alert("Enter a valid weight"); update(d => ({ ...d, weight: [...d.weight.filter(x => x.date !== today()), { date: today(), kg: v, waist: parseFloat(waist) || undefined }] }), ["weight"]); setKg(""); setWaist(""); setOpen(false); }}>Save</button>
            <button className="btn2" onClick={() => setOpen(false)}>Cancel</button></div></div>
      ) : <button className="btn" onClick={() => setOpen(true)}>+ Log weight</button>}
      <div className="card divide-y divide-[var(--line)] !py-1">{[...w].reverse().slice(0, 14).map(x => <div key={x.date} className="flex justify-between py-2.5 text-sm"><span className="text-[var(--mute)]">{x.date}</span><span className="num">{x.kg} kg{x.waist ? ` · ${x.waist} cm` : ""}</span></div>)}
        {!w.length && <p className="py-3 text-sm text-[var(--mute)]">No entries yet.</p>}</div>
    </div>);
}

const mlOf = (x: string, db: DB) => (x.includes("@") ? parseInt(x) : db.settings.bottleL * 1000);
export function useWater(db: DB, update: Upd) {
  const e = db.water[today()] || [], tot = e.reduce((a, x) => a + mlOf(x, db), 0), tgt = db.settings.waterTargetMl ?? db.settings.bottleTarget * db.settings.bottleL * 1000;
  const set = (n: string[]) => update(d => ({ ...d, water: { ...d.water, [today()]: n } }), ["water"]);
  const add = (v: number) => set([...e, `${v}@${new Date().toISOString()}`]);
  return { e, tot, tgt, pct: Math.min(100, (tot / (tgt || 1)) * 100), set, add };
}
const lit = (ml: number) => (ml / 1000).toFixed(1);

/** Home water card: progress ring, running total, quick-add buttons and today's entries. */
export function WaterCard({ db, update }: { db: DB; update: Upd }) {
  const { e, tot, tgt, pct, set, add } = useWater(db, update);
  return (<section className="card space-y-3 !p-3" aria-label="Water intake">
    <div className="flex items-center justify-between gap-2">
      <p className="flex items-center gap-2 text-[15px] font-bold"><Droplet size={20} className="text-[var(--blue)]" fill="currentColor" aria-hidden />Water Intake</p>
      <p className="num whitespace-nowrap text-[14px] text-[var(--blue)]">{lit(tot)} L <span className="text-[var(--mute)]">/ {lit(tgt)} L</span></p>
    </div>
    <div className="flex items-center gap-4">
      <Ring pct={pct} size={68} stroke={8} from="#5BB4FF" to="#1E7BEA" track="#EDEFF2" label="Water"><span className="num text-[15px]">{Math.round(pct)}%</span></Ring>
      <div className="min-w-0"><p className="num whitespace-nowrap text-[26px] leading-none text-[var(--blue)]">{lit(tot)} L</p><p className="mt-1 text-sm text-[var(--mute)]">of {lit(tgt)} L daily goal</p></div>
    </div>
    <div className="grid grid-cols-3 gap-2">{[250, 500, 1000].map(v => <button key={v} className="min-h-11 whitespace-nowrap rounded-xl bg-[var(--blueSoft)] px-1 text-[13px] font-bold text-[var(--blue)] transition active:scale-95" aria-label={`Add ${v >= 1000 ? "1 litre" : `${v} millilitres`} of water`} onClick={() => add(v)}>+{v >= 1000 ? "1 L" : `${v} ml`}</button>)}</div>
    {e.length > 0 && <details><summary className="min-h-10 cursor-pointer text-sm text-[var(--mute)]">Today&apos;s entries ({e.length})</summary>{e.map((x, i) => <div key={i} className="flex items-center justify-between py-1 text-sm"><span>{mlOf(x, db)} ml · {new Date(x.split("@")[1] || x).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span><button className="btn2 !min-h-9" aria-label={`Remove water entry ${i + 1}`} onClick={() => set(e.filter((_, k) => k !== i))}>Remove</button></div>)}</details>}</section>);
}

export function Progress({ db }: { db: DB }) {
  const w = sortedWeight(db), wv = w.map(x => x.kg), waist = w.filter(x => x.waist != null).map(x => x.waist!);
  const done = db.workouts.filter(x => x.finished);
  const names = [...new Set(done.flatMap(x => x.exercises.filter(e => e.sets.some(s => s.done)).map(e => e.name)))];
  const [ex, setEx] = useState(""); const sel = ex || names[0] || "";
  const top = done.map(x => Math.max(0, ...(x.exercises.filter(e => e.name === sel).flatMap(e => e.sets.filter(s => s.done).map(s => s.kg))))).filter(v => v > 0);
  const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 13 + i); return (db.water[d.toLocaleDateString("en-CA")] || []).length; });
  const sets = done.reduce((a, x) => a + x.exercises.reduce((b, e) => b + e.sets.filter(s => s.done).length, 0), 0);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2"><Stat label="Workouts" value={String(done.length)} /><Stat label="Sets" value={String(sets)} /><Stat label="Change" value={wv.length > 1 ? `${(wv.at(-1)! - wv[0]).toFixed(1)}` : "–"} sub="kg" /></div>
      <div className="card"><p className="lbl mb-1">Weight</p><Line values={wv} unit="kg" goal={db.profile.goalKg} /></div>
      <div className="card"><p className="lbl mb-1">Waist</p><Line values={allWaist(db).map(x => x.cm)} unit="cm" /></div>
      <div className="card space-y-2"><p className="lbl">Strength · top set</p>
        {names.length ? <><select className="inp" value={sel} onChange={e => setEx(e.target.value)} aria-label="Exercise">{names.map(n => <option key={n}>{n}</option>)}</select><Line values={top} unit="kg" /></> : <p className="text-sm text-[var(--mute)]">Finish a workout to see strength trends.</p>}</div>
      <div className="card"><p className="lbl mb-2">Water · last 14 days</p><Bars values={days} target={db.settings.bottleTarget} /></div>
    </div>);
}

export const allWaist = (db: DB) => [...new Map([...db.weight.filter(x => x.waist).map(x => ({ date: x.date, cm: x.waist! })), ...db.waist].map(x => [x.date, x])).values()].sort((a, b) => a.date.localeCompare(b.date));
export function Waist({ db, update }: { db: DB; update: Upd }) {
  const [cm, setCm] = useState(""), [err, setErr] = useState("");
  const w = allWaist(db), first = w[0], last = w.at(-1);
  const save = () => { const v = parseFloat(cm); if (!(v > 30 && v < 250)) return setErr("Enter waist in cm (30–250)"); setErr("");
    update(d => ({ ...d, waist: [...d.waist.filter(x => x.date !== today()), { date: today(), cm: v }] }), ["waist"]); setCm(""); };
  return (<div className="space-y-3">
    <div className="grid grid-cols-3 gap-2"><Stat label="Start" value={first ? `${first.cm}` : "–"} sub="cm" /><Stat label="Latest" value={last ? `${last.cm}` : "–"} sub="cm" /><Stat label="Change" value={w.length > 1 ? `${last!.cm - first.cm > 0 ? "+" : ""}${(last!.cm - first.cm).toFixed(1)}` : "–"} sub="cm" /></div>
    <div className="card"><p className="lbl mb-1">Waist trend</p><Line values={w.map(x => x.cm)} unit="cm" /></div>
    <div className="card space-y-2"><label className="lbl block">Waist today (cm)<input className="inp mt-1" inputMode="decimal" value={cm} onChange={e => setCm(e.target.value)} /></label>
      {err && <p role="alert" className="text-sm text-red-400">{err}</p>}<button className="btn" onClick={save}>Save waist</button></div>
    <div className="card divide-y divide-[var(--line)] !py-1">{[...w].reverse().slice(0, 14).map(x => <div key={x.date} className="flex items-center justify-between py-1.5 text-sm"><span className="text-[var(--mute)]">{x.date}</span><span className="num">{x.cm} cm</span>
      <button className="btn2 !min-h-9" aria-label={`Delete ${x.date} waist`} onClick={() => confirm("Delete this entry?") && update(d => ({ ...d, waist: d.waist.filter(e => e.date !== x.date), weight: d.weight.map(e => e.date === x.date ? { ...e, waist: undefined } : e) }), ["waist", "weight"])}>Delete</button></div>)}
      {!w.length && <p className="py-3 text-sm text-[var(--mute)]">No waist entries yet.</p>}</div></div>);
}
