"use client";
import { useEffect, useRef, useState } from "react";
import { Hourglass, Repeat2 } from "lucide-react";
import { DB, Workout as W, SetLog } from "@/lib/types";
import { today } from "@/lib/store";
import { generateId, planFor } from "@/lib/util";
import { deferExercise, firstOpenIndex, isCompleteEx, nextNonPendingIndex, nextOpenIndex, pendingIdx, repeatIntoNextSet, repeatState, resumeExercise } from "@/lib/workout";
import WorkoutHome from "./WorkoutHome";
import PendingList from "./Pending";

type Upd = (f: (d: DB) => DB, k: (keyof DB)[]) => void;
const blank = (n: number, kg = 0, reps = 0): SetLog => ({ n, kg, reps, done: false, ts: "" });
const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

function Stepper({ label, value, step, unit, onChange }: { label: string; value: number; step: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <div>
      <p className="lbl mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <button className="btn2 !min-h-14 w-14 !px-0 text-2xl" aria-label={`Decrease ${label}`} onClick={() => onChange(Math.max(0, +(value - step).toFixed(2)))}>−</button>
        <input className="inp flex-1 text-center num text-4xl" inputMode="decimal" aria-label={label} value={value || ""} placeholder="0"
          onChange={e => onChange(+e.target.value || 0)} />
        <button className="btn2 !min-h-14 w-14 !px-0 text-2xl" aria-label={`Increase ${label}`} onClick={() => onChange(+(value + step).toFixed(2))}>+</button>
      </div>
      {unit && <p className="mt-1 text-center text-xs text-[var(--mute)]">{unit}</p>}
    </div>
  );
}

export default function Workout({ db, update, go, focusIdx, clearFocus }: { db: DB; update: Upd; go: (t: "settings", sub?: string) => void; focusIdx: number | null; clearFocus: () => void }) {
  const plan = planFor(db, today());
  const open = db.workouts.find(w => w.date === today() && !w.finished);
  const [idxState, setIdx] = useState<number | null>(null);
  const [showSummary, setShowSummary] = useState(false), [confirmFinish, setConfirmFinish] = useState(false);
  const [repMsg, setRepMsg] = useState({ key: "", text: "" });
  const lastTap = useRef(0), initFor = useRef("");
  const [restEnd, setRestEnd] = useState(0);
  const [tick, setTick] = useState(0);
  const [saved, setSaved] = useState(false);
  useEffect(() => { if (!restEnd) return; const t = setInterval(() => setTick(x => x + 1), 500); return () => clearInterval(t); }, [restEnd]);
  void tick;
  const left = Math.max(0, Math.round((restEnd - Date.now()) / 1000));

  const lastSets = (name: string) => [...db.workouts].reverse().filter(w => w.finished)
    .map(w => w.exercises.find(e => e.name === name)?.sets.filter(s => s.done) || []).find(s => s.length) || [];
  const save = (fn: (w: W) => W) => update(d => ({ ...d, workouts: d.workouts.map(w => (w.id === open?.id ? fn(w) : w)) }), ["workouts"]);

  const lastFor = (name: string) => lastSets(name);
  // When a workout is (re)opened, land on the first unfinished, non-deferred exercise; afterwards the position is user-driven.
  const exs = open?.exercises;
  useEffect(() => { if (open && initFor.current !== open.id) { initFor.current = open.id; setIdx(firstOpenIndex(open.exercises)); setShowSummary(false); } }, [open]);
  // "Resume Exercise" from the Home dashboard jumps to that exact exercise.
  useEffect(() => { if (focusIdx != null && open) { setIdx(focusIdx); setShowSummary(false); clearFocus(); } }, [focusIdx, open, clearFocus]);
  const idx = idxState ?? (exs ? firstOpenIndex(exs) : 0);
  const start = () => { if (!plan.exercises.length) return; setIdx(null); setSaved(false); // fixed rest days / rest slots never start a gym workout
    update(d => ({ ...d, workouts: [...d.workouts, { id: generateId(), date: today(), day: plan.day, notes: "", startedAt: new Date().toISOString(),
      exercises: plan.exercises.map(name => { const p = lastSets(name); return { name, sets: [1, 2, 3].map(n => blank(n, p[n - 1]?.kg ?? p.at(-1)?.kg ?? 0, p[n - 1]?.reps ?? p.at(-1)?.reps ?? 0)) }; }) }] }), ["workouts"]); };
  // ---------- Overview (rest day, completed, or ready to start) ----------
  if (!open) return <WorkoutHome db={db} update={update} go={go} onStart={start} lastSets={lastFor} saved={saved} />;

  // ---------- shared actions ----------
  const total = open.exercises.length, pend = pendingIdx(open);
  const resume = (i: number) => { save(w => resumeExercise(w, i)); setIdx(i); setShowSummary(false); setConfirmFinish(false); };

  // ---------- Pending screen: nothing else left in the queue, but some exercises are deferred ----------
  if (idx >= total && pend.length > 0 && !showSummary) return (
    <div className="space-y-3">
      <div className="card space-y-1 text-center"><Hourglass size={28} className="mx-auto text-[#C98A00]" aria-hidden /><p className="lbl acc">No other exercises remaining</p>
        <h2 className="num text-2xl">{pend.length} exercise{pend.length === 1 ? "" : "s"} pending</h2>
        <p className="text-sm text-[var(--mute)]">Resume one when its machine is free. Pending exercises are not completed until you finish their sets.</p></div>
      <PendingList workout={open} onResume={resume} />
      {confirmFinish ? (
        <div role="alertdialog" aria-label="Confirm finish" className="card space-y-2 text-sm"><p>Finish the workout without the {pend.length} pending exercise{pend.length === 1 ? "" : "s"}? They will be saved as not completed.</p>
          <div className="grid grid-cols-2 gap-2"><button className="btn !min-h-12" onClick={() => { setShowSummary(true); setConfirmFinish(false); }}>Yes, finish</button><button className="btn2 !min-h-12" onClick={() => setConfirmFinish(false)}>Not yet</button></div></div>
      ) : <button className="btn2 w-full" onClick={() => setConfirmFinish(true)}>Finish workout anyway</button>}
      <button className="btn2 w-full" onClick={() => setIdx(total - 1)}>‹ Back</button>
    </div>);

  // ---------- Finish summary ----------
  if (idx >= total) {
    const sets = open.exercises.reduce((a, e) => a + e.sets.filter(x => x.done).length, 0);
    const mins = open.startedAt ? Math.max(1, Math.round((Date.now() - new Date(open.startedAt).getTime()) / 60000)) : 0;
    const hi = [...new Set(open.exercises.filter(e => !e.skipped && !e.pending).map(e => e.name))].flatMap(n => {
      const t = Math.max(0, ...open.exercises.filter(e => e.name === n).flatMap(e => e.sets.filter(x => x.done).map(x => x.kg))), p = Math.max(0, ...lastSets(n).map(x => x.kg));
      return p > 0 && t > p ? [`+${+(t - p).toFixed(2)} kg on ${n}`] : []; });
    return (
      <div className="space-y-3"><div className="card space-y-3 text-center"><p className="lbl acc">Workout complete ✓</p><h2 className="num text-3xl">{open.day}</h2>
        <div className="grid grid-cols-3 gap-2"><div><p className="num text-2xl">{open.exercises.filter(e => !e.skipped && !e.pending).length}/{total}</p><p className="lbl">Exercises</p></div><div><p className="num text-2xl">{sets}</p><p className="lbl">Sets</p></div><div><p className="num text-2xl">{mins || "–"}</p><p className="lbl">Min</p></div></div>
        {pend.length > 0 && <p className="text-sm text-[var(--mute)]">{pend.length} pending exercise{pend.length === 1 ? "" : "s"} will be saved as not completed.</p>}
        {hi.map(h => <p key={h} className="acc text-sm font-semibold">{h}</p>)}</div>
        <textarea className="inp py-2" placeholder="Workout notes" value={open.notes} onChange={e => save(w => ({ ...w, notes: e.target.value }))} />
        <button className="btn !min-h-16 text-lg" onClick={() => { save(w => ({ ...w, finished: true, finishedAt: new Date().toISOString() })); setSaved(true); }}>DONE</button>
        <button className="btn2 w-full" onClick={() => { setShowSummary(false); setIdx(total - 1); }}>‹ Back</button></div>);
  }

  // ---------- Focus mode ----------
  const ex = open.exercises[idx];
  const meta = db.exercises.find(e => e.name === ex.name);
  const prev = lastSets(ex.name);
  const best = Math.max(0, ...db.workouts.filter(w => w.finished).flatMap(w => w.exercises.filter(e => e.name === ex.name).flatMap(e => e.sets.filter(x => x.done).map(x => x.kg))));
  const cur = ex.sets.findIndex(s => !s.done);
  const complete = cur === -1;
  const setEx = (fn: (sets: SetLog[]) => SetLog[]) => save(w => ({ ...w, exercises: w.exercises.map((e, i) => (i === idx ? { ...e, sets: fn(e.sets) } : e)) }));
  const patch = (j: number, p: Partial<SetLog>) => setEx(s => s.map((x, k) => (k === j ? { ...x, ...p } : x)));
  // After finishing an exercise move on in planned order, leaving deferred ones in the Pending list.
  const nxt = nextNonPendingIndex(open.exercises, idx);
  const next = () => { setRestEnd(0); setIdx(nxt); };
  // Machine In Use: flag only (sets/weights/reps/notes untouched), then go to the next unfinished exercise.
  const defer = () => { save(w => deferExercise(w, idx, new Date().toISOString())); setRestEnd(0); setIdx(nextOpenIndex(open.exercises, idx)); };
  const allSets = open.exercises.reduce((a, e) => a + e.sets.length, 0), doneSets = open.exercises.reduce((a, e) => a + e.sets.filter(x => x.done).length, 0);
  const finishedEx = open.exercises.filter(e => isCompleteEx(e) || e.skipped).length, progress = (finishedEx / total) * 100;
  const cs = cur >= 0 ? ex.sets[cur] : null, pv = cs ? prev[cur] : undefined;
  const hint = !cs || !cs.kg ? [] : [
    ...(best > 0 && cs.kg > best ? ["Personal best"] : []),
    ...(pv ? [cs.kg > pv.kg ? `↑ +${+(cs.kg - pv.kg).toFixed(2)} kg vs last time` : cs.kg < pv.kg ? `↓ ${+(pv.kg - cs.kg).toFixed(2)} kg vs last time` : cs.reps === pv.reps ? `${cs.reps} reps — same as last session` : ""] : [])].filter(Boolean);
  // Repeat Set: fills the next set-entry form from the last completed set. Saving still goes through Complete Set.
  const rp = repeatIntoNextSet(ex.sets), rpState = repeatState(ex.sets), repKey = `${open.id}:${idx}:${cur}`;
  const repeat = () => { if (!rp) return; setEx(sets => repeatIntoNextSet(sets)?.sets ?? sets); setRepMsg({ key: repKey, text: `Copied ${rp.from.kg} kg × ${rp.from.reps} from Set ${rp.from.n}. Edit if needed, then tap Complete Set.` }); };
  const repeatBtn = (
    <div>
      <button className="btn2 w-full" disabled={!rp} onClick={repeat} aria-describedby="repeat-hint"><Repeat2 size={18} aria-hidden />Repeat Set{rp ? ` (${rp.from.kg} kg × ${rp.from.reps})` : ""}</button>
      <p id="repeat-hint" className="mt-1 text-center text-xs text-[var(--mute)]" aria-live="polite">{rp ? (repMsg.key === repKey ? repMsg.text : "Copies your last completed set into this set. You still confirm it.") : rpState === "no-previous" ? "Complete a set first, then you can repeat it." : "All target sets are logged. Tap + Set to add another."}</p>
    </div>);

  return (
    <div className="space-y-3">
      <div>
        <div className="flex justify-between"><span className="lbl">{open.day}</span><span className="text-sm font-semibold">{idx + 1} / {total}</span></div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--card2)]" role="progressbar" aria-label="Exercises completed" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-[var(--acc)] transition-all duration-300" style={{ width: `${progress}%` }} /></div>
        <p className="mt-1 text-xs text-[var(--mute)]">{doneSets} / {allSets} sets completed · {finishedEx} / {total} exercises done{pend.length > 0 ? ` · ${pend.length} pending` : ""}</p>
      </div>

      <div><p className="lbl">{meta?.primary || "Custom"}</p><h2 className="num text-3xl leading-tight">{ex.name}</h2>
        <p className="mt-1 text-sm text-[var(--mute)]"><span className="lbl">Last time </span>{prev.length ? prev.map(s => `${s.kg}×${s.reps}`).join("  ") : "No previous record"}</p></div>

      {ex.skipped ? <div className="card text-center text-[var(--mute)]">Skipped</div> : ex.pending ? (
        <div className="card space-y-2 !border-[var(--amber)]"><p className="flex items-center gap-2 font-bold"><Hourglass size={20} className="text-[#C98A00]" aria-hidden />Pending · machine in use</p>
          <p className="text-sm text-[var(--mute)]">This exercise is on hold and not completed. Your sets are kept: {ex.sets.filter(x => x.done).length} / {ex.sets.length} done.</p>
          {ex.sets.filter(x => x.done).map(s => <p key={s.n} className="num text-sm"><span className="acc">✓ Set {s.n}</span> {s.kg} kg × {s.reps}</p>)}
          <button className="btn !min-h-14" onClick={() => resume(idx)}>Resume Exercise</button></div>
      ) : (<>
        <div className="space-y-1">
          {ex.sets.map((s, j) => s.done ? (
            <button key={j} className="pop flex min-h-11 w-full items-center justify-between rounded-lg bg-[var(--card)] px-3 text-left" onClick={() => patch(j, { done: false })} aria-label={`Undo set ${s.n}`}>
              <span className="acc font-semibold">✓ Set {s.n}</span><span className="num">{s.kg} kg × {s.reps}</span></button>
          ) : j === cur ? (
            <div key={j} className="card space-y-3 !border-[var(--acc)] !p-4"><p className="lbl acc">Set {s.n}</p>
              <Stepper label="Weight" unit="kg" step={2.5} value={s.kg} onChange={v => patch(j, { kg: v })} />
              <Stepper label="Reps" step={1} value={s.reps} onChange={v => patch(j, { reps: v })} />
              {hint.length > 0 && <p className="acc text-center text-sm font-semibold" aria-live="polite">{hint.join(" · ")}</p>}
              {repeatBtn}
              <button className="btn !min-h-16 text-lg" onClick={() => { const t = Date.now(); if (t - lastTap.current < 700) return; lastTap.current = t; /* ignores accidental double-taps so one set is never saved twice */ patch(j, { done: true, ts: new Date(t).toISOString() }); setRestEnd(t + 90000); }}>✓ COMPLETE SET</button></div>
          ) : (
            <div key={j} className="flex min-h-11 items-center justify-between px-3 text-[var(--mute)]"><span>Set {s.n}</span><span>{s.kg || "–"} kg × {s.reps || "–"}</span></div>
          ))}
        </div>
        {complete && repeatBtn}
      </>)}

      {restEnd > 0 && left > 0 && (
        <div className="card pop flex items-center justify-between !py-3" role="timer"><div><p className="lbl">Rest</p><p className="num acc text-3xl">{fmt(left)}</p></div>
          <div className="flex gap-2"><button className="btn2" onClick={() => setRestEnd(restEnd + 30000)}>+30 SEC</button><button className="btn2" onClick={() => setRestEnd(0)}>SKIP</button></div></div>)}

      {(complete || ex.skipped) && !ex.pending && (
        <div className="card pop space-y-2 text-center"><p className="lbl acc">{ex.skipped ? "Exercise skipped" : "✓ Exercise complete"}</p>
          {!ex.skipped && <p className="text-sm text-[var(--mute)]">{ex.name} · {ex.sets.filter(x => x.done).length} / {ex.sets.length} sets</p>}
          <p className="lbl pt-1">{nxt < total ? "Next up" : pend.length ? "Pending exercises waiting" : "Last exercise"}</p>{nxt < total && <p className="num text-xl">{open.exercises[nxt].name}</p>}
          <button className="btn" onClick={next}>{nxt < total ? "NEXT EXERCISE" : pend.length ? "VIEW PENDING EXERCISES" : "FINISH"}</button></div>)}

      {!ex.skipped && !ex.pending && !complete && (
        <button className="btn2 w-full !border-[var(--amber)] !bg-[var(--amberSoft)] !text-[#7A5400]" onClick={defer}><Hourglass size={18} aria-hidden />Machine In Use</button>)}

      <div className="flex items-center gap-2 [&>button]:whitespace-nowrap [&>button]:!px-2">
        <button className="btn2 flex-1" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>‹ Prev</button>
        {!ex.skipped && !ex.pending && <button className="btn2 flex-1" onClick={() => setEx(s => [...s, blank(s.length + 1, s.at(-1)?.kg || 0, s.at(-1)?.reps || 0)])}>+ Set</button>}
        {!ex.pending && <button className="btn2 flex-1" onClick={() => save(w => ({ ...w, exercises: w.exercises.map((e, i) => (i === idx ? { ...e, skipped: !e.skipped } : e)) }))}>{ex.skipped ? "Unskip" : "Skip"}</button>}
        <button className="btn2 flex-1" onClick={() => setIdx(idx + 1)}>Next ›</button>
      </div>

      {pend.length > 0 && !ex.pending && <PendingList workout={open} onResume={resume} />}
      {pend.length > 0 && ex.pending && pend.length > 1 && <PendingList workout={{ ...open, exercises: open.exercises.map((e, i) => (i === idx ? { ...e, pending: false } : e)) }} onResume={resume} />}
    </div>
  );
}
