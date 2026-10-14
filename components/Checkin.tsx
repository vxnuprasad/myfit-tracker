"use client";
import { useState } from "react";
import { DB } from "@/lib/types";
import { today } from "@/lib/store";
import { sortedWeight, allWaist } from "./Body";
type Upd = (f: (d: DB) => DB, k: (keyof DB)[]) => void;
export default function Checkin({ db, update }: { db: DB; update: Upd }) {
  const [f, setF] = useState({ date: today(), kg: "", cm: "", note: "" }), [err, setErr] = useState(""), [msg, setMsg] = useState("");
  const w = sortedWeight(db), wa = allWaist(db), cmOf = (d: string) => wa.find(x => x.date === d)?.cm;
  const exists = w.some(x => x.date === f.date) || wa.some(x => x.date === f.date), set = (k: string, v: string) => setF(x => ({ ...x, [k]: v }));
  const save = () => { const kg = parseFloat(f.kg), cm = parseFloat(f.cm);
    if (!f.date || f.date > today()) return setErr("Choose today or an earlier date."); if (!(kg > 20 && kg < 400)) return setErr("Weight must be 20–400 kg."); if (!(cm > 30 && cm < 250)) return setErr("Waist must be 30–250 cm.");
    setErr(""); update(d => ({ ...d, weight: [...d.weight.filter(x => x.date !== f.date), { date: f.date, kg, note: f.note || undefined }], waist: [...d.waist.filter(x => x.date !== f.date), { date: f.date, cm }] }), ["weight", "waist"]);
    setMsg(exists ? `Updated ${f.date}.` : `Saved ${f.date}.`); setF({ date: today(), kg: "", cm: "", note: "" }); };
  const lw = w.at(-1), pw = w.at(-2), lc = wa.at(-1), pc = wa.at(-2), sg = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(1)}`;
  return (<div className="space-y-3">
    <div className="grid grid-cols-2 gap-2"><div className="card !p-3"><p className="lbl">Weight</p><p className="num text-xl">{lw ? `${lw.kg} kg` : "–"}</p><p className="text-xs text-[var(--mute)]">{lw ? `${lw.date}${pw ? ` · ${sg(lw.kg - pw.kg)} kg vs ${pw.date}` : ""}` : "Not recorded"}</p></div>
      <div className="card !p-3"><p className="lbl">Waist</p><p className="num text-xl">{lc ? `${lc.cm} cm` : "–"}</p><p className="text-xs text-[var(--mute)]">{lc ? `${lc.date}${pc ? ` · ${sg(lc.cm - pc.cm)} cm vs ${pc.date}` : ""}` : "Not recorded"}</p></div></div>
    <label className="lbl block">Date<input type="date" className="inp mt-1" value={f.date} max={today()} onChange={e => set("date", e.target.value)} /></label>
    <div className="grid grid-cols-2 gap-2"><label className="lbl block">Weight (kg)<input className="inp mt-1" inputMode="decimal" value={f.kg} onChange={e => set("kg", e.target.value)} /></label><label className="lbl block">Waist (cm)<input className="inp mt-1" inputMode="decimal" value={f.cm} onChange={e => set("cm", e.target.value)} /></label></div>
    <input className="inp" placeholder="Notes (optional)" value={f.note} onChange={e => set("note", e.target.value)} />
    {exists && <p className="text-xs text-[var(--mute)]">An entry exists for {f.date}; saving will replace it (correction).</p>}
    {err && <p role="alert" className="text-sm text-red-400">{err}</p>}{msg && <p role="status" className="acc text-sm">{msg}</p>}
    <button className="btn" onClick={save}>Save check-in</button>
    <div className="divide-y divide-[var(--line)]">{[...w].reverse().slice(0, 12).map(x => <div key={x.date} className="flex items-center justify-between gap-2 py-2 text-sm"><div><p className="num">{x.kg} kg · {cmOf(x.date) ?? "–"} cm</p><p className="text-xs text-[var(--mute)]">{x.date}{x.note ? ` · ${x.note}` : ""}</p></div>
      <div className="flex gap-1"><button className="btn2 !min-h-10 !px-2" onClick={() => setF({ date: x.date, kg: String(x.kg), cm: String(cmOf(x.date) ?? ""), note: x.note ?? "" })}>Edit</button>
        <button className="btn2 !min-h-10 !px-2" aria-label={`Delete ${x.date}`} onClick={() => confirm("Delete this check-in?") && update(d => ({ ...d, weight: d.weight.filter(e => e.date !== x.date), waist: d.waist.filter(e => e.date !== x.date) }), ["weight", "waist"])}>✕</button></div></div>)}
      {!w.length && <p className="py-2 text-sm text-[var(--mute)]">No check-ins yet.</p>}</div></div>);
}
