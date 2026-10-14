"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { BellRing, Check, Pause, Play, Square, Timer as TimerIcon, X } from "lucide-react";
import { today } from "@/lib/store";
import { DURATION_OPTIONS_MIN, IDLE, TIMER_KEY, TimerState, fmtClock, markAlerted, pauseTimer, reconcile, remainingMs, resetTimer, resumeTimer, sanitizeTimer, selectDuration, startTimer } from "@/lib/timer";
import { Meter } from "./ui";

/* ---------------------------------------------------------------------------
   One app-wide self-workout timer (5 or 10 minutes), shown on Home only.
   - State lives in localStorage (TIMER_KEY) as an absolute end timestamp, so internal navigation, minimising the browser,
     background-tab throttling and page refreshes all show the correct remaining time. Nothing depends on a visible screen.
   - The provider is mounted once at the top of the app (app/page.tsx), so switching tabs never creates a second timer
     and the completion alert works on every screen.
   - Limitation (by design of the web platform): nothing runs while the browser is fully closed or the device is asleep.
     The timer is still correct when you come back, because it compares against the clock.
--------------------------------------------------------------------------- */
type Api = {
  state: TimerState; remaining: number; alertOpen: boolean;
  start: () => void; setDuration: (min: number) => void; pause: () => void; resume: () => void; stop: () => void; dismissAlert: () => void;
  notif: "unsupported" | "default" | "granted" | "denied"; askNotif: () => void;
};
const Ctx = createContext<Api | null>(null);
export const useSelfTimer = () => { const c = useContext(Ctx); if (!c) throw new Error("useSelfTimer must be used inside <TimerProvider>"); return c; };

const read = (): TimerState => { try { const raw = localStorage.getItem(TIMER_KEY); return raw ? sanitizeTimer(JSON.parse(raw), Date.now(), today()) : IDLE; } catch { return IDLE; } };
const write = (s: TimerState) => { try { localStorage.setItem(TIMER_KEY, JSON.stringify(s)); } catch { /* storage unavailable: timer still works until reload */ } };
const notifState = (): Api["notif"] => (typeof Notification === "undefined" ? "unsupported" : Notification.permission);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TimerState>(IDLE), [, force] = useState(0), [alertOpen, setAlertOpen] = useState(false), [notif, setNotif] = useState<Api["notif"]>("unsupported");
  const ref = useRef<TimerState>(IDLE), audio = useRef<AudioContext | null>(null);

  const commit = useCallback((s: TimerState) => { ref.current = s; setState(s); write(s); }, []);

  const celebrate = useCallback(() => {
    try { navigator.vibrate?.([300, 150, 300, 150, 300]); } catch { /* not supported */ }
    try { // short beep; only audible if the browser allowed audio after the user pressed Start
      const a = audio.current; if (a && a.state === "running") for (let i = 0; i < 3; i++) { const o = a.createOscillator(), g = a.createGain(); o.connect(g); g.connect(a.destination); o.frequency.value = 880; g.gain.value = 0.15; o.start(a.currentTime + i * 0.35); o.stop(a.currentTime + i * 0.35 + 0.2); }
    } catch { /* ignore */ }
    try { if (typeof Notification !== "undefined" && Notification.permission === "granted" && document.hidden) new Notification("Warm-up complete", { body: `Your ${Math.round(ref.current.durationMs / 60000)}-minute self-workout timer has finished.`, tag: "myfit-selftimer" }); } catch { /* ignore */ }
  }, []);

  /** Single place that detects completion and raises the alert exactly once (persisted flag, also checked against other tabs). */
  const check = useCallback(() => {
    let cur = ref.current;
    const r = reconcile(cur, Date.now()); if (r.state !== cur) { cur = r.state; commit(cur); }
    if (cur.status === "completed" && !cur.alerted) {
      const stored = read(); // another tab may already have alerted for this very completion
      if (stored.status === "completed" && stored.alerted) { commit(stored); return; }
      commit(markAlerted(cur)); setAlertOpen(true); celebrate();
    }
  }, [commit, celebrate]);

  // Load once on mount (restores running / paused / completed after a refresh), then keep in sync.
  useEffect(() => {
    ref.current = read(); setState(ref.current); setNotif(notifState()); check();
    const wake = () => { check(); force(x => x + 1); };
    const onStorage = (e: StorageEvent) => { if (e.key === TIMER_KEY) { ref.current = read(); setState(ref.current); force(x => x + 1); } };
    document.addEventListener("visibilitychange", wake); window.addEventListener("focus", wake); window.addEventListener("pageshow", wake); window.addEventListener("storage", onStorage);
    return () => { document.removeEventListener("visibilitychange", wake); window.removeEventListener("focus", wake); window.removeEventListener("pageshow", wake); window.removeEventListener("storage", onStorage); };
  }, [check]);

  // The interval only repaints and re-checks. It is not the source of truth, so throttling cannot cause drift.
  const running = state.status === "running";
  useEffect(() => { if (!running) return; const t = setInterval(() => { check(); force(x => x + 1); }, 250); return () => clearInterval(t); }, [running, check]);

  const remaining = remainingMs(state, Date.now()); // recomputed on every repaint tick; the wall clock is the source of truth
  const api = useMemo<Api>(() => ({
    state, remaining, alertOpen, notif,
    start: () => {
      if (ref.current.status === "running") return; // never two active timers
      try { const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext; if (AC && !audio.current) audio.current = new AC(); audio.current?.resume(); } catch { /* ignore */ }
      setAlertOpen(false); commit(startTimer(Date.now(), today(), ref.current.durationMs));
    },
    setDuration: (min: number) => { const n = selectDuration(ref.current, min * 60000); if (n !== ref.current) commit(n); }, // ignored while running/paused
    pause: () => { const n = pauseTimer(ref.current, Date.now()); if (n !== ref.current) { commit(n); check(); } },
    resume: () => { const n = resumeTimer(ref.current, Date.now()); if (n !== ref.current) commit(n); },
    stop: () => { setAlertOpen(false); commit(resetTimer(ref.current)); },
    dismissAlert: () => setAlertOpen(false),
    askNotif: () => { try { if (typeof Notification !== "undefined" && Notification.permission === "default") Notification.requestPermission().then(p => setNotif(p)); } catch { /* ignore */ } },
  }), [state, remaining, alertOpen, notif, commit, check]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

/** App-wide completion banner: appears on any screen, once per completion, and needs no browser permission. */
export function TimerAlert() {
  const { alertOpen, dismissAlert, stop, state } = useSelfTimer();
  if (!alertOpen) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] px-3" style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}>
      <div role="alert" className="pop pointer-events-auto mx-auto flex max-w-xl items-center gap-3 rounded-2xl border border-[var(--green)] bg-white p-3 shadow-xl">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--greenSoft)] text-[var(--green)]"><BellRing size={22} aria-hidden /></span>
        <div className="min-w-0 flex-1"><p className="font-bold leading-tight">Time&apos;s up! Warm-up complete.</p><p className="text-sm text-[var(--mute)]">Your {Math.round(state.durationMs / 60000)} minutes are done. Start your strength exercises.</p></div>
        <div className="flex shrink-0 flex-col gap-1">
          <button className="btn !min-h-10 !w-auto !px-3 !text-sm" onClick={dismissAlert}>OK</button>
          <button className="btn2 !min-h-9 !px-2 !text-xs" onClick={stop}>Reset</button></div>
      </div>
    </div>);
}

const CHIP: Record<TimerState["status"], { t: string; c: string }> = {
  idle: { t: "Ready", c: "bg-[var(--card2)] text-[var(--mute)]" }, running: { t: "Running", c: "bg-[var(--accSoft)] text-[var(--acc)]" },
  paused: { t: "Paused", c: "bg-[var(--amberSoft)] text-[#9A6B00]" }, completed: { t: "Completed", c: "bg-[var(--greenSoft)] text-[#14804F]" },
};
const HELP: Record<TimerState["status"], string> = {
  idle: "Pick 5 or 10 minutes, do your own warm-up, and press Start when you begin.", running: "Counting down. It keeps running if you switch pages or minimise the browser.",
  paused: "Paused. Resume continues from where you stopped.", completed: "Great work. Warm-up complete. Now start your strength exercises.",
};

/** The self-workout timer card (Home only). "compact" is a slim one-line version for use further down the workout. */
export function SelfTimerCard({ compact = false }: { compact?: boolean }) {
  const { state, remaining, start, setDuration, pause, resume, stop, notif, askNotif } = useSelfTimer(), [ask, setAsk] = useState(false), st = state.status, dur = state.durationMs, durMin = Math.round(dur / 60000), locked = st === "running" || st === "paused";
  useEffect(() => { if (st !== "running" && st !== "paused") setAsk(false); }, [st]);
  const clock = fmtClock(remaining), pct = ((dur - remaining) / dur) * 100, chip = CHIP[st];
  const live = <span className="sr-only" aria-live="polite">{st === "idle" ? "" : `Self-workout timer ${chip.t.toLowerCase()}`}</span>;

  if (compact) return (
    <section className="card flex items-center gap-3 !p-3" aria-label="Self-workout timer">
      <TimerIcon size={22} className="shrink-0 text-[var(--acc)]" aria-hidden />
      <div className="min-w-0 flex-1"><p className="lbl leading-tight">Self-workout timer · {chip.t}</p><p className="num acc text-2xl leading-tight" role="timer" aria-live="off">{clock}</p></div>
      {st === "running" && <button className="btn2 !min-h-11" onClick={pause}><Pause size={16} aria-hidden />Pause</button>}
      {st === "paused" && <button className="btn2 !min-h-11" onClick={resume}><Play size={16} aria-hidden />Resume</button>}
      {st === "completed" && <button className="btn2 !min-h-11" onClick={stop}>Reset</button>}
      {live}</section>);

  return (
    <section className="card space-y-3" aria-label="Self-workout timer">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-[15px] font-bold"><TimerIcon size={20} className="text-[var(--acc)]" aria-hidden />Self-workout timer</p>
        <span className={`rounded-full px-3 py-1 text-[12.5px] font-bold ${chip.c}`}>{chip.t}</span></div>
      <p className="lbl -mt-1">First activity of every gym day</p>
      <div role="radiogroup" aria-label="Timer length" className="grid grid-cols-2 gap-2">
        {DURATION_OPTIONS_MIN.map(m => { const on = durMin === m; return (
          <button key={m} role="radio" aria-checked={on} disabled={locked && !on} onClick={() => setDuration(m)}
            className={`min-h-11 rounded-full border text-[15px] font-bold transition disabled:opacity-40 ${on ? "border-[var(--acc)] bg-[var(--acc)] text-white shadow" : "border-[var(--line)] bg-white text-[var(--mute)]"}`}>{m} min</button>); })}
      </div>
      <div className="text-center">
        <p className={`num text-[64px] leading-none ${st === "completed" ? "text-[var(--green)]" : st === "paused" ? "text-[#9A6B00]" : "acc"}`} role="timer" aria-live="off" aria-label={`${clock} remaining`}>{st === "completed" ? <Check className="mx-auto" size={56} strokeWidth={3} aria-label="Completed" /> : clock}</p>
        <p className="mt-2 text-sm text-[var(--mute)]" aria-live="polite">{HELP[st]}</p></div>
      <Meter pct={st === "completed" ? 100 : pct} from="#FF8A4C" to="#FF4A12" track="#FFE8DA" label="Warm-up progress" now={Math.round((dur - remaining) / 1000)} max={dur / 1000} />
      {ask ? (
        <div role="alertdialog" aria-label="Confirm stop" className="space-y-2 rounded-2xl bg-[var(--card2)] p-3 text-sm">
          <p>Stop this warm-up? Your remaining <b>{clock}</b> will be discarded and the timer resets to {fmtClock(dur)}.</p>
          <div className="grid grid-cols-2 gap-2"><button className="btn !min-h-12" onClick={() => { setAsk(false); stop(); }}>Yes, stop</button><button className="btn2 !min-h-12" onClick={() => setAsk(false)}>Keep going</button></div></div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {st === "idle" && <button className="btn col-span-2 !min-h-14 text-lg" onClick={start}><Play size={20} fill="currentColor" aria-hidden />Start {fmtClock(dur)}</button>}
          {st === "running" && <><button className="btn !min-h-14" onClick={pause}><Pause size={20} aria-hidden />Pause</button><button className="btn2 !min-h-14" onClick={() => setAsk(true)}><Square size={16} aria-hidden />Stop</button></>}
          {st === "paused" && <><button className="btn !min-h-14" onClick={resume}><Play size={20} fill="currentColor" aria-hidden />Resume</button><button className="btn2 !min-h-14" onClick={() => setAsk(true)}><Square size={16} aria-hidden />Stop</button></>}
          {st === "completed" && <><button className="btn !min-h-14" onClick={start}><Play size={20} fill="currentColor" aria-hidden />Start again</button><button className="btn2 !min-h-14" onClick={stop}><X size={16} aria-hidden />Reset</button></>}
        </div>)}
      {notif === "default" && st !== "completed" && <button className="btn2 w-full !min-h-11 !text-[13px]" onClick={askNotif}><BellRing size={16} aria-hidden />Also notify me when the timer ends (optional)</button>}
      {notif === "denied" && <p className="text-xs text-[var(--mute)]">Browser notifications are off. The in-app alert still works.</p>}
      {live}</section>);
}
