"use client";
import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { DB } from "@/lib/types";
import { today } from "@/lib/store";
import { idxFor } from "@/lib/util";
import { shortDay } from "./ui";

type Upd = (f: (d: DB) => DB, k: (keyof DB)[]) => void;
const L = ["D1", "D2", "D3", "D4", "D5", "D6", "D7"];
/** Edits db.program (the repeating 7-day cycle, Day 1 first). Persisted under the existing "program" sync key. */
export default function PlanEditor({ db, update, startIdx }: { db: DB; update: Upd; startIdx?: number }) {
  const [i, setI] = useState(startIdx ?? idxFor(db, today())), [name, setName] = useState("");
  const p = db.program[i];
  const edit = (fn: (x: DB["program"][number]) => DB["program"][number]) => update(d => ({ ...d, program: d.program.map((x, k) => (k === i ? fn(x) : x)) }), ["program"]);
  const move = (j: number, dir: -1 | 1) => edit(x => { const a = [...x.exercises], t = a[j + dir]; if (t === undefined) return x; a[j + dir] = a[j]; a[j] = t; return { ...x, exercises: a }; });
  const addEx = () => { const n = name.trim(); if (!n) return; edit(x => ({ ...x, exercises: [...x.exercises, n] })); setName(""); };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-1" role="tablist" aria-label="Day of the cycle">{L.map((l, k) => (
        <button key={l} role="tab" aria-selected={i === k} onClick={() => setI(k)} className={`min-h-14 rounded-2xl px-0.5 text-center text-xs font-bold ${i === k ? "bg-[var(--acc)] text-white" : "bg-white text-[var(--ink)] border border-[var(--line)]"}`}>{l}<span className={`block text-[10.5px] font-medium ${i === k ? "text-white/85" : "text-[var(--mute)]"}`}>{db.program[k].exercises.length ? shortDay(db.program[k].day) : "Rest"}</span></button>))}</div>
      <label className="block"><span className="lbl">Name for this day</span><input className="inp mt-1" value={p.day} onChange={e => edit(x => ({ ...x, day: e.target.value }))} /></label>
      {p.day.trim().toLowerCase() === "rest" && p.exercises.length > 0 && <p className="text-xs text-[var(--mute)]">This day is named “Rest” but has exercises. Rename it so it is easy to recognise.</p>}
      <div className="space-y-2">
        {p.exercises.map((e, j) => (
          <div key={`${e}-${j}`} className="card flex items-center gap-2 !rounded-2xl !p-2 !pl-3">
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">{j + 1}. {e}</span>
            <button className="icon-btn !h-10 !w-10 !rounded-xl" aria-label={`Move ${e} up`} disabled={j === 0} onClick={() => move(j, -1)}><ArrowUp size={16} aria-hidden /></button>
            <button className="icon-btn !h-10 !w-10 !rounded-xl" aria-label={`Move ${e} down`} disabled={j === p.exercises.length - 1} onClick={() => move(j, 1)}><ArrowDown size={16} aria-hidden /></button>
            <button className="icon-btn !h-10 !w-10 !rounded-xl text-[var(--red)]" aria-label={`Remove ${e}`} onClick={() => edit(x => ({ ...x, exercises: x.exercises.filter((_, k) => k !== j) }))}><X size={16} aria-hidden /></button>
          </div>))}
        {!p.exercises.length && <p className="rowbg px-3 py-3 text-sm text-[var(--mute)]">No exercises. This day is a rest day.</p>}
      </div>
      <div className="flex gap-2"><input className="inp" list="plan-ex" placeholder="Add an exercise" aria-label="Exercise to add" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && addEx()} />
        <datalist id="plan-ex">{db.exercises.map(e => <option key={e.name} value={e.name} />)}</datalist>
        <button className="btn !w-auto !px-4" onClick={addEx} aria-label="Add exercise"><Plus size={20} aria-hidden /></button></div>
      <p className="text-xs text-[var(--mute)]">Changes save automatically and apply to future workouts. A workout already in progress keeps its own exercises.</p>
    </div>
  );
}
