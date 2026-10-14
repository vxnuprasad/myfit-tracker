"use client";
import { useRef, useState } from "react";
import { CalendarDays, ChevronDown, ChevronRight, Pencil, Settings as Cog } from "lucide-react";
import { DB, SetLog } from "@/lib/types";
import { today } from "@/lib/store";
import { isFixedRest, isSkipped, planFor } from "@/lib/util";
import Hero from "./Hero";
import WeekStrip from "./WeekStrip";
import PlanEditor from "./PlanEditor";
import { ExThumb } from "./art";
import { PageHead, Sheet } from "./ui";

type Upd = (f: (d: DB) => DB, k: (keyof DB)[]) => void;
export const REST_SEC = 90; // matches the in-workout rest timer

export default function WorkoutHome({ db, update, go, onStart, lastSets, saved }: {
  db: DB; update: Upd; go: (t: "settings", sub?: string) => void;
  onStart: () => void; lastSets: (n: string) => SetLog[]; saved: boolean;
}) {
  const td = today(), skipped = isSkipped(db, td), plan = skipped ? { ...planFor(db, td), exercises: [] as string[] } : planFor(db, td), listRef = useRef<HTMLDivElement>(null);
  const [openRow, setOpenRow] = useState(-1), [editing, setEditing] = useState(false);
  const done = db.workouts.find(w => w.date === td && w.finished);
  const doneSets = done?.exercises.reduce((a, e) => a + e.sets.filter(s => s.done).length, 0);
  const lw = [...db.workouts].reverse().find(w => w.finished && w.day === plan.day);
  return (<>
    <PageHead title="Workouts" sub="Your training plan · Stay consistent" right={<>
      <button className="icon-btn" aria-label="Weekly summary" onClick={() => go("settings", "weekly")}><CalendarDays size={22} aria-hidden /></button>
      <button className="icon-btn" aria-label="Settings" onClick={() => go("settings")}><Cog size={22} aria-hidden /></button></>} />
    <WeekStrip db={db} />
    <Hero db={db} update={update} variant="workout" onStart={onStart} onView={() => { setTimeout(() => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0); }} doneSets={saved || done ? doneSets : undefined} />

    <div ref={listRef} className="scroll-mt-4" />
    {(<>
      <div className="flex items-center justify-between"><h2 className="text-[22px] font-bold">Workout Exercises</h2>
        <button className="btn2 !min-h-11 !rounded-full" onClick={() => setEditing(true)}><Pencil size={16} aria-hidden />Edit Plan</button></div>
      <ol className="space-y-2.5">
        {plan.exercises.map((n, i) => { const m = db.exercises.find(e => e.name === n), prev = lastSets(n), o = openRow === i, badges = [m?.primary || "Custom", m?.secondary].filter(Boolean) as string[]; return (
          <li key={i} className="card !rounded-[22px] !p-2.5">
            <button className="flex w-full items-center gap-3 text-left" aria-expanded={o} onClick={() => setOpenRow(o ? -1 : i)}>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#EFEBE6] text-sm font-bold text-[#5B5660]">{i + 1}</span>
              <ExThumb name={n} equipment={m?.equipment} className="h-[58px] w-[70px] shrink-0 rounded-xl" />
              <span className="min-w-0 flex-1"><b className="block truncate text-[16px]">{n}</b>
                <span className="block text-[13px] text-[var(--mute)]">3 sets <span aria-hidden>•</span> {REST_SEC}s rest{prev.length ? <> <span aria-hidden>•</span> last {prev[0].kg}×{prev[0].reps}</> : null}</span>
                <span className="mt-1 flex flex-wrap gap-1.5">{badges.map(b => <span key={b} className="rounded-full bg-[var(--accSoft)] px-2.5 py-0.5 text-[12px] font-semibold text-[var(--acc)]">{b}</span>)}</span></span>
              {o ? <ChevronDown size={22} className="shrink-0 text-[var(--mute)]" aria-hidden /> : <ChevronRight size={22} className="shrink-0 text-[var(--mute)]" aria-hidden />}
            </button>
            {o && <div className="rowbg mt-2 p-3 text-sm"><p className="font-semibold">Last time</p>
              <p className="text-[var(--mute)]">{prev.length ? prev.map(s => `${s.kg} kg × ${s.reps}`).join("  ·  ") : "No previous record yet"}</p>
              {m?.equipment && <p className="mt-1 text-[var(--mute)]">Equipment: {m.equipment}</p>}</div>}
          </li>); })}
        {!plan.exercises.length && <li className="card text-center text-sm text-[var(--mute)]">{skipped ? "Today's workout was skipped. Your schedule has moved forward one day." : isFixedRest(db, td) ? "Sunday is a fixed rest day. No gym workout is scheduled." : "Nothing scheduled today. Use Edit Plan to add exercises to a day."}</li>}
      </ol>
      {lw && <div className="card"><p className="font-bold">Last {plan.day}</p><p className="text-sm text-[var(--mute)]">{lw.date} · {lw.exercises.reduce((a, e) => a + e.sets.filter(x => x.done).length, 0)} sets</p></div>}
    </>)}
    <Sheet open={editing} onClose={() => setEditing(false)} title="Edit plan"><PlanEditor db={db} update={update} /></Sheet>
  </>);
}
