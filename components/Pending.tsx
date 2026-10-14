"use client";
import { Hourglass, Play } from "lucide-react";
import { Workout } from "@/lib/types";
import { pendingIdx } from "@/lib/workout";

/** Pending Exercises (machine in use). Shared by the active workout screen and the Home dashboard. */
export default function PendingList({ workout, onResume, empty }: { workout: Workout; onResume: (i: number) => void; empty?: React.ReactNode }) {
  const list = pendingIdx(workout);
  if (!list.length) return empty ? <>{empty}</> : null;
  return (
    <section className="card space-y-2 !border-[var(--amber)] !p-3" aria-label="Pending exercises">
      <p className="flex items-center gap-2 text-[15px] font-bold"><Hourglass size={20} className="text-[#C98A00]" aria-hidden />Pending Exercises <span className="rounded-full bg-[var(--amberSoft)] px-2 py-0.5 text-[12.5px] text-[#9A6B00]">{list.length}</span></p>
      <p className="-mt-1 text-xs text-[var(--mute)]">{workout.day} · skipped for now because the machine was in use. Not completed.</p>
      <ul className="space-y-2">
        {list.map(i => { const e = workout.exercises[i], done = e.sets.filter(s => s.done); return (
          <li key={i} className="rowbg flex items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <b className="block truncate text-[15px]">{e.name}</b>
              <span className="block text-[13px] text-[var(--mute)]">{done.length} / {e.sets.length} sets done{done.length ? <> · {done.map(s => `${s.kg}×${s.reps}`).join("  ")}</> : null}</span></div>
            <button className="btn !min-h-11 !w-auto !px-3 !text-[14px]" onClick={() => onResume(i)} aria-label={`Resume exercise ${e.name}`}><Play size={16} fill="currentColor" aria-hidden />Resume Exercise</button>
          </li>); })}
      </ul>
    </section>);
}
