"use client";
import { useCallback, useState } from "react";
import { Dumbbell, House, Settings as Cog } from "lucide-react";
import { useDB, today } from "@/lib/store";
import { resumeExercise } from "@/lib/workout";
import Workout from "@/components/Workout";
import HomeView from "@/components/Home";
import Settings, { Sub } from "@/components/Settings";
import { Logo } from "@/components/art";
import Footer from "@/components/Footer";
import { TimerAlert, TimerProvider } from "@/components/SelfTimer";

type Tab = "home" | "workout" | "settings";
const NAV = [{ id: "home", label: "Home", I: House }, { id: "workout", label: "Workouts", I: Dumbbell }, { id: "settings", label: "Settings", I: Cog }] as const;

export default function App() {
  const { db, ready, update, sync, state, last, restore } = useDB();
  const [tab, setTab] = useState<Tab>("home"), [sub, setSub] = useState<Sub>(""), [focusIdx, setFocusIdx] = useState<number | null>(null);
  const go = (t: Tab, s?: string) => {
    setTab(t); if (t === "settings") setSub((s as Sub) || "");
    window.scrollTo({ top: 0 });
  };
  const clearFocus = useCallback(() => setFocusIdx(null), []);
  // Resume Exercise from the Home dashboard: clear the deferral on today's open workout and open that exact exercise.
  const resumeFromHome = (i: number) => {
    const open = db.workouts.find(w => w.date === today() && !w.finished); if (!open) return;
    update(d => ({ ...d, workouts: d.workouts.map(w => (w.id === open.id ? resumeExercise(w, i) : w)) }), ["workouts"]);
    setFocusIdx(i); go("workout");
  };
  if (!ready) return <div className="grid min-h-dvh place-items-center" role="status"><div className="flex flex-col items-center gap-3"><Logo size={56} /><p className="text-[var(--mute)]">Loading…</p></div></div>;
  return (
    <TimerProvider>
      <div className="relative mx-auto max-w-xl" style={{ paddingBottom: "calc(6.5rem + env(safe-area-inset-bottom))" }}>
        <TimerAlert />
        <main className="relative space-y-4 px-4" style={{ paddingTop: "calc(1rem + env(safe-area-inset-top))" }}>
          {tab === "home" && <HomeView db={db} update={update} go={go} onResume={resumeFromHome} />}
          {tab === "workout" && <Workout db={db} update={update} go={go} focusIdx={focusIdx} clearFocus={clearFocus} />}
          {tab === "settings" && <Settings db={db} update={update} sync={sync} state={state} last={last} restore={restore} sub={sub} setSub={setSub} go={go} />}
        </main>
        <Footer />
        <nav className="fixed inset-x-0 bottom-0 z-40" aria-label="Main">
          <div className="mx-auto max-w-xl rounded-t-[28px] border border-b-0 border-[var(--line)] bg-white/85 shadow-[0_-10px_30px_-14px_rgba(120,70,20,.22)] backdrop-blur-xl" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
            <div className="flex">{NAV.map(n => { const on = tab === n.id; return (
              <button key={n.id} onClick={() => go(n.id)} aria-current={on ? "page" : undefined} className={`flex min-h-[68px] flex-1 flex-col items-center justify-center gap-0.5 text-[12.5px] font-semibold transition-colors ${on ? "text-[var(--acc)]" : "text-[#7D7885]"}`}>
                <n.I size={26} strokeWidth={on ? 2.3 : 2} aria-hidden />{n.label}<span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${on ? "bg-[var(--acc)]" : "bg-transparent"}`} /></button>); })}</div>
          </div>
        </nav>
      </div>
    </TimerProvider>);
}
