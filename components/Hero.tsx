"use client";
import { useState } from "react";
import { CalendarCheck, CalendarClock, CheckCircle2, ChevronRight, Clock, Dumbbell, Play } from "lucide-react";
import { DB } from "@/lib/types";
import { today } from "@/lib/store";
import { applyLeave, idxFor, isFixedRest, isSkipped, planFor } from "@/lib/util";
import { HeroArt } from "./art";

type Upd = (f: (d: DB) => DB, k: (keyof DB)[]) => void;
export const WARMUP_MIN = 14; // the 14-minute self-workout timer + ~3 min per planned set
export const PLANNED_SETS_PER_EXERCISE = 3;

/** Today's workout hero. Start/View callbacks are supplied by the page so Home and Workouts can behave differently. */
export default function Hero({ db, update, variant, onStart, onView, doneSets }: { db: DB; update: Upd; variant: "home" | "workout"; onStart: () => void; onView: () => void; doneSets?: number }) {
  const td = today(), plan = planFor(db, td), skipped = isSkipped(db, td);
  const done = db.workouts.find(w => w.date === td && w.finished), open = db.workouts.find(w => w.date === td && !w.finished);
  const [ask, setAsk] = useState(false), [msg, setMsg] = useState("");
  const rest = !plan.exercises.length, sets = plan.exercises.length * PLANNED_SETS_PER_EXERCISE, mins = WARMUP_MIN + sets * 3;
  const canLeave = !rest && !skipped && !done && !open;
  const leave = () => {
    update(d => applyLeave(d, td), ["settings"]);
    setAsk(false); setMsg(`Skipped ${plan.day}. Your schedule moved forward one day, so tomorrow is ${plan.day}.`);
  };
  return (
    <>
      {msg && <p role="status" className="card !py-3 text-sm font-semibold acc">{msg}</p>}
      <section className="hero p-5" aria-label="Today's workout">
        <HeroArt className="pointer-events-none absolute inset-y-0 right-0 h-full w-[80%]" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#15110E] from-25% via-[#15110E]/55 via-60% to-transparent" />
        <div className="relative">
          <div className="flex items-center justify-between gap-2 text-[13px] font-semibold tracking-wide">
            <span className="flex items-center gap-2"><Dumbbell size={22} className="text-[var(--acc)]" aria-hidden />TODAY&apos;S WORKOUT</span>
            <span className="text-white/90">{isFixedRest(db, td) ? "Sunday · rest" : `Day ${idxFor(db, td) + 1} of 7`}</span>
          </div>
          <h2 className="num mt-4 max-w-[92%] text-[28px] leading-tight">{skipped ? "Skipped" : rest ? "Rest day" : plan.day}</h2>
          {skipped ? <p className="mt-2 max-w-[75%] text-sm text-white/75">{plan.day} was skipped. Your schedule has moved forward one day.</p>
            : rest ? <p className="mt-2 max-w-[75%] text-sm text-white/75">{isFixedRest(db, td) ? "Sunday is a fixed rest day. No workout or warm-up timer today." : "No workout or warm-up scheduled. Recovery is part of the program."}</p>
            : variant === "home" ? (
              <div className="mt-4 flex gap-4 text-sm">
                <div className="flex items-center gap-2.5"><span className="grid h-11 w-11 place-items-center rounded-xl border border-white/20 bg-white/10"><CalendarCheck size={22} aria-hidden /></span><span><b className="block">{plan.exercises.length} exercises</b><span className="text-white/75">{sets} planned sets</span></span></div>
                <div className="flex items-center gap-2.5"><span className="grid h-11 w-11 place-items-center rounded-xl border border-white/20 bg-white/10"><Clock size={22} aria-hidden /></span><span><b className="block">~{mins} min</b><span className="text-white/75">est. incl. warm-up</span></span></div>
              </div>
            ) : (
              <p className="mt-2 text-[15px] leading-relaxed text-white/85">{plan.exercises.length} exercises <span aria-hidden>•</span> {sets} planned sets<br />~{mins} min (est. incl. warm-up)</p>
            )}
          {done && <p className="mt-4 flex items-center gap-2 font-bold text-[#5BE3A0]"><CheckCircle2 size={20} aria-hidden />Completed today{doneSets != null ? ` · ${doneSets} sets logged` : ""}</p>}
          {!rest && !skipped && (
            <div className="mt-5 flex gap-3">
              {!done && <button className="btn flex-1 !w-auto" onClick={onStart}><Play size={18} fill="currentColor" aria-hidden />{open ? "Resume Workout" : "Start Workout"}</button>}
              <button className={done ? "hero-btn flex-1" : "hero-btn"} onClick={onView}>View Plan</button>
            </div>
          )}
          {canLeave && !ask && (
            <button className="hero-btn mt-3 w-full !justify-between !px-4" onClick={() => setAsk(true)}>
              <span className="flex items-center gap-3"><CalendarClock size={22} aria-hidden />Leave</span><ChevronRight size={20} aria-hidden />
            </button>
          )}
          {canLeave && ask && (
            <div role="alertdialog" aria-label="Confirm Leave" className="mt-3 space-y-3 rounded-2xl border border-white/20 bg-black/40 p-3 text-sm backdrop-blur">
              <p>Leave today&apos;s <b>{plan.day}</b>? Today will be marked Skipped and every upcoming workout and rest day moves forward one day.</p>
              <div className="flex gap-2"><button className="btn !min-h-11 flex-1 !w-auto" onClick={leave}>Confirm</button><button className="hero-btn !min-h-11 flex-1" onClick={() => setAsk(false)}>Cancel</button></div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
