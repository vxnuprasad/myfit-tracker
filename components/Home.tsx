"use client";
import { ChevronRight, Pill, ChartColumn, Ruler, Scale, CupSoda } from "lucide-react";
import { DB } from "@/lib/types";
import { today } from "@/lib/store";
import { Line } from "./Charts";
import { WaterCard, sortedWeight, allWaist } from "./Body";
import Hero from "./Hero";
import WeekStrip from "./WeekStrip";
import { Logo, Mountains } from "./art";
import { SunNote, addDays, fmtLong, fmtShort } from "./ui";
import { planFor, isSkipped } from "@/lib/util";
import { SelfTimerCard, useSelfTimer } from "./SelfTimer";
import PendingList from "./Pending";
import { SuppKey, setSupplement } from "@/lib/supplements";

type Upd = (f: (d: DB) => DB, k: (keyof DB)[]) => void;
type Go = (t: "workout" | "settings", sub?: string) => void;
const LINES = [
  ["Keep showing up. Progress is a result of consistent days.", "Discipline today builds the tomorrow you want."],
  ["Small steps, repeated daily, become big changes.", "Show up for the version of you a month from now."],
  ["Consistency beats intensity. Do the work, then rest well.", "One good session is worth more than a perfect plan."],
  ["You don't have to feel ready. You just have to start.", "Strong habits are built one ordinary day at a time."],
];
const DN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Daily supplement check-in: Taken / Not taken, with the current status always visible. Tap the selected button again to clear (correction). */
function Supp({ label, icon: Icon, value, set }: { label: string; icon: typeof Pill; value: boolean | undefined; set: (v: boolean | undefined) => void }) {
  const status = value === true ? "Taken today" : value === false ? "Marked not taken" : "Not recorded yet";
  const btn = (on: boolean, t: boolean, text: string, mark: string) => (
    <button aria-pressed={on} onClick={() => set(on ? undefined : t)} className={`flex min-h-11 min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border px-2 text-[13px] font-bold transition ${on ? (t ? "border-[rgba(34,181,115,.45)] bg-[var(--greenSoft)] text-[#14804F]" : "border-[rgba(240,82,74,.4)] bg-[var(--redSoft)] text-[#B3342D]") : "border-[var(--line)] bg-white text-[var(--mute)]"}`}><span aria-hidden>{mark}</span>{text}</button>);
  return (
    <div className="rowbg flex flex-wrap items-center gap-x-3 gap-y-2 p-2.5" role="group" aria-label={`${label} today`}>
      <div className="flex min-w-0 flex-1 basis-40 items-center gap-2.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--accSoft)] text-[var(--acc)]"><Icon size={20} aria-hidden /></span>
        <div className="min-w-0"><p className="text-[14px] font-bold leading-tight">{label}</p>
          <p className={`text-[12px] font-semibold leading-tight ${value === true ? "text-[#14804F]" : value === false ? "text-[#B3342D]" : "text-[var(--mute)]"}`} aria-live="polite">{status}</p></div></div>
      <div className="grid min-w-0 flex-1 basis-52 grid-cols-2 gap-2">{btn(value === true, true, "Taken", "✓")}{btn(value === false, false, "Not taken", "✕")}</div>
      {value !== undefined && <p className="basis-full text-center text-[11px] leading-tight text-[var(--mute)]">Tap the selected button again to undo.</p>}
    </div>);
}

export default function HomeView({ db, update, go, onResume }: { db: DB; update: Upd; go: Go; onResume: (i: number) => void }) {
  const td = today(), now = new Date(), hr = now.getHours(), name = db.profile.name.trim();
  const w = sortedWeight(db), wa = allWaist(db), timer = useSelfTimer();
  const monStr = addDays(-((now.getDay() + 6) % 7)), lw = w.at(-1), lc = wa.at(-1);
  const day = db.settings.checkinDay ?? 1;
  const lines = LINES[Math.floor(now.getTime() / 86400000) % LINES.length];
  const supp = db.supplements?.[td] ?? {}, showP = db.settings.proteinCheckin !== false, showC = db.settings.creatineCheckin !== false;
  // Date-specific (keyed by day), so a new day starts unrecorded and older days are never touched. undefined = cleared.
  const setSupp = (k: SuppKey, v: boolean | undefined) => update(d => setSupplement(d, td, k, v), ["supplements"]);
  const when = (d?: string) => (d ? (d >= monStr ? "Logged this week" : `Last logged ${fmtShort(d)}`) : "Not logged yet");
  const doneSets = db.workouts.find(x => x.date === td && x.finished)?.exercises.reduce((a, e) => a + e.sets.filter(s => s.done).length, 0);
  const plan = planFor(db, td), gymDay = plan.exercises.length > 0 && !isSkipped(db, td), finishedToday = db.workouts.some(x => x.date === td && x.finished);
  const openToday = db.workouts.find(x => x.date === td && !x.finished);

  return (<>
    <header className="relative -mx-4 px-4">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-[calc(1rem+env(safe-area-inset-top))] h-[300px] overflow-hidden [mask-image:linear-gradient(to_bottom,#000_60%,transparent)]">
        <Mountains className="absolute right-0 top-0 h-full w-full" /><div className="absolute inset-0 bg-gradient-to-r from-[var(--bg)] via-[var(--bg)]/30 to-transparent" /></div>
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3"><Logo size={48} />
            <div><p className="num text-[24px] leading-none">MyFit <span className="acc">Tracker</span></p><p className="mt-1 text-sm font-medium text-[var(--mute)]">{fmtLong(td).replace(/^(\w{3}) /, "$1, ")}</p></div></div>
          <button onClick={() => go("settings")} aria-label="Open settings" className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-[#A9714F] to-[#7A4A2E] text-lg font-bold text-white shadow-md">{(name[0] || "M").toUpperCase()}</button>
        </div>
        <div className="mt-6 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold tracking-[.2em] text-[#5A5560]">GOOD {hr < 12 ? "MORNING" : hr < 18 ? "AFTERNOON" : "EVENING"}{name ? "," : ""}</p>
            <h1 className="num mt-1 text-[40px] leading-[1.05]">{name || "Let\u2019s train"} <span aria-hidden>👋</span></h1>
            <p className="mt-2 max-w-[17rem] text-[15.5px] leading-snug text-[#4D4852]">{lines[0]}</p>
          </div>
          <SunNote className="mt-6 w-[36%] max-w-[148px] shrink-0">{lines[1]}</SunNote>
        </div>
      </div>
    </header>

    <Hero db={db} update={update} variant="home" onStart={() => go("workout")} onView={() => go("workout")} doneSets={doneSets} />
    {gymDay && (!finishedToday ? <SelfTimerCard /> : timer.state.status !== "idle" && <SelfTimerCard compact />)}
    {openToday && <PendingList workout={openToday} onResume={onResume} />}
    <WeekStrip db={db} />

    <WaterCard db={db} update={update} />
    {(showP || showC) && (
      <section className="card space-y-2 !p-3" aria-label="Daily supplements">
        <p className="flex items-center gap-2 text-[15px] font-bold"><Pill size={20} className="text-[var(--acc)]" aria-hidden />Daily Supplements</p>
        {showP && <Supp label="Protein supplement" icon={CupSoda} value={supp.protein} set={v => setSupp("protein", v)} />}
        {showC && <Supp label="Creatine" icon={Pill} value={supp.creatine} set={v => setSupp("creatine", v)} />}
      </section>)}

    <section className="card !p-4" aria-label="Weekly check-in">
      <button className="flex w-full items-center justify-between text-left" onClick={() => go("settings", "checkin")}>
        <span className="flex items-center gap-2 text-[16px] font-bold"><ChartColumn size={22} className="text-[var(--acc)]" aria-hidden />Weekly Check-in</span>
        <span className="flex items-center gap-1 text-xs text-[var(--mute)]">{DN[day]}{now.getDay() === day ? " (today)" : ""}<ChevronRight size={20} aria-hidden /></span></button>
      <div className="mt-3 grid grid-cols-2 items-center gap-x-2 gap-y-3 min-[460px]:grid-cols-[1fr_1fr_auto]">
        <div className="flex items-center gap-2"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--card2)] text-[#6B6570]"><Scale size={22} aria-hidden /></span>
          <div className="min-w-0"><p className="text-[12.5px] text-[var(--mute)]">Weight</p><p className="num text-xl leading-tight">{lw ? lw.kg : "--"} <span className="text-sm">kg</span></p><p className="text-[11px] leading-tight text-[var(--mute)]">{when(lw?.date)}</p></div></div>
        <div className="flex items-center gap-2 border-l border-[var(--line)] pl-2"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--card2)] text-[#6B6570]"><Ruler size={22} aria-hidden /></span>
          <div className="min-w-0"><p className="text-[12.5px] text-[var(--mute)]">Waist</p><p className="num text-xl leading-tight">{lc ? lc.cm : "--"} <span className="text-sm">cm</span></p><p className="text-[11px] leading-tight text-[var(--mute)]">{when(lc?.date)}</p></div></div>
        <button className="btn col-span-2 !min-h-12 !text-[14px] min-[460px]:col-span-1 min-[460px]:!w-auto min-[460px]:!px-3" onClick={() => go("settings", "checkin")}>Log check-in</button>
      </div>
    </section>

    {w.length > 1 && <section className="card"><p className="text-[16px] font-bold">Weight</p><Line values={w.slice(-12).map(x => x.kg)} unit="kg" /><p className="text-xs text-[var(--mute)]">Recorded check-ins only · latest {w.at(-1)!.kg} kg on {w.at(-1)!.date}</p></section>}
  </>);
}
