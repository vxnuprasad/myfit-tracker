"use client";
import { useState } from "react";
import { Check, Minus, X } from "lucide-react";
import { DB } from "@/lib/types";
import { today } from "@/lib/store";
import { isSkipped, planFor } from "@/lib/util";
import { addDays, fmtShort, shortDay } from "./ui";

const L = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
/** Monday-first weekly training strip. Tapping a day shows that day's planned exercises. */
export default function WeekStrip({ db }: { db: DB }) {
  const td = today(), mon = (new Date().getDay() + 6) % 7, [sel, setSel] = useState("");
  const fin = db.workouts.filter(w => w.finished);
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(i - mon), p = planFor(db, d);
    const skip = isSkipped(db, d);
    return { d, l: L[i], skip, rest: !skip && !p.exercises.length, done: fin.some(x => x.date === d), today: d === td, past: d < td, name: skip ? "Skipped" : p.exercises.length ? shortDay(p.day) : "Rest", full: skip ? `${p.day} (skipped)` : p.exercises.length ? p.day : "Rest", ex: skip ? [] : p.exercises };
  });
  const view = week.find(x => x.d === sel);
  return (
    <section aria-label="This week" className="card !p-2">
      <div className="grid grid-cols-7 gap-0.5">
        {week.map(x => (
          <button key={x.d} onClick={() => setSel(sel === x.d ? "" : x.d)} aria-pressed={sel === x.d}
            aria-label={`${x.l} ${fmtShort(x.d)}, ${x.full}: ${x.done ? "completed" : x.skip ? "skipped" : x.rest ? "rest day" : x.past ? "not completed" : x.today ? "today" : "planned"}`}
            className={`flex min-h-[92px] flex-col items-center justify-center gap-1 rounded-2xl px-0.5 py-2 transition-colors ${x.today ? "bg-[var(--accSoft)]" : sel === x.d ? "bg-[var(--card2)]" : ""}`}>
            <span className="text-[13px] font-bold">{x.l}</span>
            <span className="text-[10.5px] text-[var(--mute)]">{fmtShort(x.d)}</span>
            <span className={`mt-0.5 grid h-8 w-8 place-items-center rounded-full ${x.done ? "bg-[var(--green)] text-white" : x.skip ? "border-2 border-[#F4B7B0] bg-white text-[var(--red)]" : x.today ? "border-2 border-[var(--acc)] bg-white" : x.rest ? "border-2 border-[#D9D3CC] bg-white text-[#B9B2AA]" : x.past ? "border-2 border-[#F4B7B0] bg-white text-[var(--red)]" : "border-2 border-[#E2DCD5] bg-white"}`}>
              {x.done ? <Check size={18} strokeWidth={3} aria-hidden /> : x.skip ? <X size={14} strokeWidth={3} aria-hidden /> : x.today ? <span className="h-2 w-2 rounded-full bg-[var(--acc)]" /> : x.rest ? <Minus size={14} strokeWidth={3} aria-hidden /> : x.past ? <X size={14} strokeWidth={3} aria-hidden /> : null}
            </span>
            <span className={`text-[12.5px] font-semibold ${x.today ? "acc" : ""}`}>{x.name}</span>
          </button>))}
      </div>
      {view && (
        <div className="rowbg mx-1 mb-1 mt-2 space-y-1 p-3" aria-live="polite">
          <p className="text-sm font-bold">{view.l} · {view.full}</p>
          {view.ex.map((e, i) => <p key={i} className="text-sm text-[var(--mute)]">{e}</p>)}
          {!view.ex.length && <p className="text-sm text-[var(--mute)]">{view.skip ? "Skipped." : "Rest day."}</p>}
        </div>)}
    </section>
  );
}
