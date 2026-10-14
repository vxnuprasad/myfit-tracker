"use client";
import { useState } from "react";
import { Bell, CalendarDays, ChartColumn, ChevronLeft, ChevronRight, ClipboardList, Cloud, CloudUpload, Database, Download, Droplet, Dumbbell, FileJson, FileSpreadsheet, Pencil, Pill, CupSoda, Ruler, Scale, Settings as Cog, Target, Trash2 } from "lucide-react";
import { DB } from "@/lib/types";
import { seed } from "@/lib/seed";
import { SyncState, setPassword } from "@/lib/store";
import { weeklyMarkdown, download } from "@/lib/report";
import { DAY_NAMES, SCHEDULE_V } from "@/lib/util";
import Checkin from "./Checkin";
import Export from "./Export";
import PlanEditor from "./PlanEditor";
import { Progress, Waist, Weight } from "./Body";
import { NumField, PageHead, Sheet, addDays, fmtN } from "./ui";

type Upd = (f: (d: DB) => DB, k: (keyof DB)[]) => void;
export type Sub = "" | "goals" | "profile" | "checkin" | "weekly" | "progress" | "weight" | "waist" | "plan" | "equipment" | "export" | "sync";
const TITLES: Record<Exclude<Sub, "">, string> = { goals: "Goals & Targets", profile: "Edit Profile", checkin: "Weekly check-in", weekly: "Weekly summary", progress: "Progress", weight: "Weight", waist: "Waist", plan: "Weekly Training Plan", equipment: "Gym Equipment", export: "Export to Excel", sync: "Cloud sync" };
const monday = () => addDays(-((new Date().getDay() + 6) % 7));

const Section = ({ icon: I, title, right, children }: { icon: typeof Cog; title: string; right?: React.ReactNode; children: React.ReactNode }) => (
  <section className="card !p-0 overflow-hidden"><div className="flex items-center justify-between px-4 pb-1 pt-4"><h2 className="flex items-center gap-2.5 text-[18px] font-bold"><I size={22} className="text-[var(--acc)]" aria-hidden />{title}</h2>{right}</div><div className="pb-1">{children}</div></section>);
type RowP = { icon: typeof Cog; bg: string; fg: string; title: string; sub?: string; value?: string; onClick?: () => void; children?: React.ReactNode };
function Row({ icon: I, bg, fg, title, sub, value, onClick, children }: RowP) {
  const inner = (<>
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl" style={{ background: bg, color: fg }}><I size={22} aria-hidden /></span>
    <span className="min-w-0 flex-1"><b className="block text-[16px] font-semibold leading-tight">{title}</b>{sub && <span className="block text-[13.5px] leading-snug text-[var(--mute)]">{sub}</span>}</span>
    {value && <span className="shrink-0 text-[14px] text-[var(--mute)]">{value}</span>}{children}
    {onClick && <ChevronRight size={20} className="shrink-0 text-[var(--mute)]" aria-hidden />}</>);
  const cls = "relative flex min-h-[60px] w-full items-center gap-3 border-t border-[var(--line)] px-4 py-2 text-left first:border-0";
  return onClick ? <button className={cls} onClick={onClick}>{inner}</button> : <div className={cls}>{inner}</div>;
}
function Switch({ on, set, label }: { on: boolean; set: (v: boolean) => void; label: string }) {
  return <button role="switch" aria-checked={on} aria-label={label} onClick={() => set(!on)} className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? "bg-[var(--green)]" : "bg-[#D9D3CC]"}`}><span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} /></button>;
}

function parseBackup(text: string): DB {
  const j = JSON.parse(text);
  if (!j || typeof j !== "object" || Array.isArray(j)) throw new Error("This file is not a MyFit backup.");
  for (const k of ["profile", "settings"]) if (!j[k] || typeof j[k] !== "object") throw new Error(`Backup is missing "${k}".`);
  for (const k of ["weight", "food", "workouts", "program", "exercises"]) if (j[k] !== undefined && !Array.isArray(j[k])) throw new Error(`Backup field "${k}" is invalid.`);
  if (!Array.isArray(j.program) || j.program.length !== 7) throw new Error("Backup is missing the 7-day workout program.");
  return { ...seed, ...j, settings: { ...j.settings, scheduleV: j.settings.scheduleV ?? SCHEDULE_V } } as DB;
}

function Equipment({ db, update }: { db: DB; update: Upd }) {
  const [n, setN] = useState(""), [m, setM] = useState(""), [q, setQ] = useState("");
  const setEq = (name: string, eq: string) => update(d => ({ ...d, exercises: d.exercises.map(e => (e.name === name ? { ...e, equipment: eq } : e)) }), ["exercises"]);
  const dup = db.exercises.some(e => e.name.toLowerCase() === n.trim().toLowerCase());
  return (<div className="space-y-3">
    <p className="text-sm text-[var(--mute)]">Edit the equipment or machine name for each exercise.</p>
    <input className="inp" placeholder="Filter exercises" aria-label="Filter exercises" value={q} onChange={e => setQ(e.target.value)} />
    <div className="card divide-y divide-[var(--line)] !p-0">{db.exercises.filter(e => e.name.toLowerCase().includes(q.toLowerCase())).map(e => (
      <label key={e.name} className="block px-4 py-2.5"><span className="text-sm font-bold">{e.name}</span><span className="ml-2 text-xs text-[var(--mute)]">{e.primary}</span>
        <input className="inp mt-1 !min-h-11" aria-label={`Equipment for ${e.name}`} value={e.equipment ?? ""} placeholder="Equipment / machine name" onChange={ev => setEq(e.name, ev.target.value)} /></label>))}</div>
    <div className="card space-y-2"><p className="font-bold">Add an exercise</p>
      <input className="inp" placeholder="Exercise name" value={n} onChange={e => setN(e.target.value)} /><div className="grid grid-cols-2 gap-2"><input className="inp" placeholder="Muscle group" value={m} onChange={e => setM(e.target.value)} /><input className="inp" placeholder="Equipment" id="neweq" /></div>
      {dup && <p className="text-xs text-[var(--red)]">An exercise with this name already exists.</p>}
      <button className="btn" disabled={!n.trim() || dup} onClick={() => { const eq = (document.getElementById("neweq") as HTMLInputElement).value.trim(); update(d => ({ ...d, exercises: [...d.exercises, { name: n.trim(), primary: m.trim() || "Custom", equipment: eq }] }), ["exercises"]); setN(""); setM(""); (document.getElementById("neweq") as HTMLInputElement).value = ""; }}>Add exercise</button></div>
  </div>);
}

export default function Settings({ db, update, sync, state, last, restore, sub, setSub, go }: {
  db: DB; update: Upd; sync: (force?: boolean) => void; state: SyncState; last: string; restore: (d: DB) => void; sub: Sub; setSub: (s: Sub) => void; go: (t: "workout", sub?: string) => void;
}) {
  const s = db.settings, name = db.profile.name.trim(), [wk, setWk] = useState(monday());
  const [res, setRes] = useState<{ ok: boolean; t: string } | null>(null), [reset, setReset] = useState(false), [word, setWord] = useState("");
  const set = (p: Partial<DB["settings"]>) => update(d => ({ ...d, settings: { ...d.settings, ...p } }), ["settings"]);
  const prof = (p: Partial<DB["profile"]>) => update(d => ({ ...d, profile: { ...d.profile, ...p } }), ["profile"]);
  const rest = db.program.filter(p => !p.exercises.length).length;
  const equip = new Set(db.exercises.map(e => (e.equipment || "").trim()).filter(Boolean)).size;
  const label = { idle: last ? "" : "Not synced yet", syncing: "Syncing…", ok: "✓ Synced", failed: "Sync failed", conflict: "Remote has newer data" }[state];
  const waterL = s.waterTargetMl ?? s.bottleTarget * s.bottleL * 1000;
  const stat = (k: boolean) => (k ? "Enabled" : "Disabled");

  if (sub) return (<>
    <header className="flex items-center gap-2"><button className="icon-btn" aria-label="Back to settings" onClick={() => setSub("")}><ChevronLeft size={22} aria-hidden /></button><h1 className="num text-[26px]">{TITLES[sub]}</h1></header>
    {sub === "goals" && <div className="card space-y-3">
      <NumField label="Water target" unit="ml" value={s.waterTargetMl} onCommit={v => set({ waterTargetMl: v })} hint={s.waterTargetMl ? undefined : `Currently ${fmtN(waterL)} ml from your bottle settings.`} />
      <NumField label="Goal weight" unit="kg" decimal value={db.profile.goalKg || undefined} onCommit={v => prof({ goalKg: v ?? 0 })} />
      <p className="text-xs text-[var(--mute)]">Targets are optional. Changes save automatically.</p></div>}
    {sub === "profile" && <div className="card space-y-3">
      <label className="block"><span className="lbl">Name</span><input className="inp mt-1" value={db.profile.name} onChange={e => prof({ name: e.target.value })} /></label>
      <NumField label="Height" unit="cm" decimal value={db.profile.heightCm} onCommit={v => prof({ heightCm: v ?? 0 })} />
      <NumField label="Starting weight" unit="kg" decimal value={db.profile.startKg} onCommit={v => prof({ startKg: v ?? 0 })} />
      <label className="block"><span className="lbl">Date of birth</span><input type="date" className="inp mt-1" value={db.profile.dob} onChange={e => prof({ dob: e.target.value })} /></label></div>}
    {sub === "checkin" && <div className="card"><Checkin db={db} update={update} /></div>}
    {sub === "weekly" && <>
      <label className="block"><span className="lbl">Week starting</span><input type="date" className="inp mt-1" value={wk} onChange={e => setWk(e.target.value)} /></label>
      {weeklyMarkdown(db, wk).split(/^## /m).slice(1).map(sec => { const [h, ...ls] = sec.trim().split("\n"); return (
        <section key={h} className="card space-y-1"><p className="font-bold">{h}</p>{ls.filter(Boolean).map((l, i) => <p key={i} className={`text-sm ${/Not recorded/.test(l) ? "text-[var(--mute)]" : ""}`}>{l.replace(/^### /, "")}</p>)}</section>); })}
      <button className="btn" onClick={() => download(`MyFit_Weekly_Report_${wk}.md`, weeklyMarkdown(db, wk))}>Export weekly report</button></>}
    {sub === "progress" && <Progress db={db} />}{sub === "weight" && <Weight db={db} update={update} />}{sub === "waist" && <Waist db={db} update={update} />}
    {sub === "plan" && <PlanEditor db={db} update={update} />}
    {sub === "equipment" && <Equipment db={db} update={update} />}
    {sub === "export" && <div className="card"><Export db={db} /></div>}
    {sub === "sync" && <div className="card space-y-3"><button className="btn" onClick={() => sync()}>Sync now</button><p role="status" className="text-sm">{label} {last && `· Last synced: ${last}`}</p>
      {state === "conflict" && <button className="btn2 w-full" onClick={() => sync(true)}>Keep my data and overwrite</button>}
      <label className="block"><span className="lbl">App password</span><input type="password" className="inp mt-1" autoComplete="off" onChange={e => setPassword(e.target.value)} /></label>
      <p className="text-xs text-[var(--mute)]">Cloud sync needs the server settings from .env.example. Your data is always saved on this device first.</p></div>}
  </>);

  return (<>
    <PageHead title="Settings" sub="Personalise your journey" mountains note="Small settings today, bigger results tomorrow." />

    <section className="card flex items-center gap-4 !p-4" aria-label="Profile">
      <button className="flex min-w-0 flex-1 items-center gap-4 text-left" onClick={() => setSub("profile")}>
        <span className="grid h-[68px] w-[68px] shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#A9714F] to-[#7A4A2E] text-3xl font-bold text-white">{(name[0] || "M").toUpperCase()}</span>
        <span className="min-w-0"><b className="num block truncate text-[24px] leading-tight">{name || "Your name"}</b><span className="block text-[15px] text-[var(--mute)]">MyFit Tracker</span>
          <span className="mt-1.5 inline-flex min-h-8 items-center gap-1.5 rounded-full bg-[var(--card2)] px-3 text-[13px] font-semibold"><Pencil size={14} aria-hidden />Edit Profile</span></span></button>
      <ChevronRight size={22} className="text-[var(--mute)]" aria-hidden /></section>

    <Section icon={Target} title="Goals & Targets" right={<button className="btn2 !min-h-10 !rounded-xl !bg-[var(--card2)]" onClick={() => setSub("goals")}><Pencil size={16} aria-hidden />Edit</button>}>
      <div className="grid grid-cols-1 gap-2 px-3 pb-3 min-[360px]:grid-cols-2">
        <button onClick={() => setSub("goals")} className="rowbg flex items-center gap-3 p-3 text-left"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--blueSoft)] text-[var(--blue)]"><Droplet size={24} fill="currentColor" aria-hidden /></span><span className="flex-1"><span className="block text-[13.5px] font-semibold">Water Target</span><span className="whitespace-nowrap text-[14.5px]">{fmtN(waterL)} ml/day</span></span><ChevronRight size={18} className="hidden shrink-0 text-[var(--mute)] min-[420px]:block" aria-hidden /></button>
        <button onClick={() => setSub("goals")} className="rowbg flex items-center gap-3 p-3 text-left"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[var(--acc2)] to-[var(--acc)] text-white"><Scale size={22} aria-hidden /></span><span className="flex-1"><span className="block text-[13.5px] font-semibold">Goal Weight</span><span className="whitespace-nowrap text-[14.5px]">{db.profile.goalKg ? `${db.profile.goalKg} kg` : "Not set"}</span></span><ChevronRight size={18} className="hidden shrink-0 text-[var(--mute)] min-[420px]:block" aria-hidden /></button></div>
    </Section>

    <Section icon={Cog} title="Preferences">
      <Row icon={Ruler} bg="#FFEBDD" fg="#FF5A1F" title="Units" sub="Kilograms (kg), Centimeters (cm), Milliliters (ml)" />
      <Row icon={CalendarDays} bg="#FFE9EE" fg="#F0527A" title="Weekly check-in day" value={DAY_NAMES[s.checkinDay ?? 1]}>
        <select aria-label="Weekly check-in day" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" value={s.checkinDay ?? 1} onChange={e => set({ checkinDay: +e.target.value })}>{DAY_NAMES.map((n, i) => <option key={n} value={i}>{n}</option>)}</select><ChevronRight size={20} className="shrink-0 text-[var(--mute)]" aria-hidden /></Row>
      <Row icon={CupSoda} bg="#EEEBFF" fg="#6D5BE8" title="Protein supplement check-in" value={stat(s.proteinCheckin !== false)}><Switch label="Protein supplement check-in" on={s.proteinCheckin !== false} set={v => set({ proteinCheckin: v })} /></Row>
      <Row icon={Pill} bg="#E3F7EC" fg="#22B573" title="Creatine check-in" value={stat(s.creatineCheckin !== false)}><Switch label="Creatine check-in" on={s.creatineCheckin !== false} set={v => set({ creatineCheckin: v })} /></Row>
    </Section>

    <Section icon={Dumbbell} title="Workout Plan">
      <Row icon={ClipboardList} bg="#FFEBDD" fg="#FF5A1F" title="Weekly Training Plan" sub={`${7 - rest}-day split with ${rest} rest day${rest === 1 ? "" : "s"}`} onClick={() => setSub("plan")} />
    </Section>

    <Section icon={Dumbbell} title="Equipment" right={<span className="mr-[-4px] rounded-full bg-[var(--accSoft)] px-3 py-1 text-[13px] font-semibold text-[#9A4A1E]">{equip} item{equip === 1 ? "" : "s"}</span>}>
      <Row icon={ClipboardList} bg="#FFEBDD" fg="#FF5A1F" title="Manage Gym Equipment" sub="Edit available equipment and machine names" onClick={() => setSub("equipment")} /></Section>

    <Section icon={ChartColumn} title="Tracking & Reports">
      <Row icon={Scale} bg="#E8F2FF" fg="#2F8CFF" title="Weekly check-in" sub="Log weight and waist" onClick={() => setSub("checkin")} />
      <Row icon={CalendarDays} bg="#FFEBDD" fg="#FF5A1F" title="Weekly summary" sub="Review and export a week" onClick={() => setSub("weekly")} />
      <Row icon={ChartColumn} bg="#E3F7EC" fg="#22B573" title="Progress" sub="Strength, weight, waist and water trends" onClick={() => setSub("progress")} />
    </Section>

    <Section icon={Cloud} title="Cloud Sync"><Row icon={Cloud} bg="#E8F2FF" fg="#2F8CFF" title="Sync and app password" sub={`${label || "Ready"}${last ? ` · ${last}` : ""}`} onClick={() => setSub("sync")} /></Section>

    <Section icon={Database} title="Data Management">
      <div className="grid grid-cols-1 gap-2 px-3 pb-2 min-[380px]:grid-cols-3 min-[380px]:gap-1.5">
        <button className="flex items-center gap-2.5 min-[380px]:flex-col min-[380px]:items-start min-[380px]:gap-1.5 rounded-2xl bg-[var(--greenSoft)] p-2.5 text-left" onClick={() => setSub("export")}><Download size={28} className="shrink-0 text-[var(--green)]" aria-hidden /><span><b className="block text-[14px]">Export to Excel</b><span className="text-[12.5px] text-[var(--mute)]">Download .xlsx file</span></span></button>
        <label className="flex cursor-pointer items-center gap-2.5 min-[380px]:flex-col min-[380px]:items-start min-[380px]:gap-1.5 rounded-2xl bg-[var(--blueSoft)] p-2.5 focus-within:outline focus-within:outline-2 focus-within:outline-[var(--acc)]"><CloudUpload size={28} className="shrink-0 text-[var(--blue)]" aria-hidden /><span><b className="block text-[14px]">Import Backup</b><span className="text-[12.5px] text-[var(--mute)]">Restore from JSON</span></span>
          <input type="file" accept="application/json,.json" className="sr-only" onChange={async e => { const f = e.target.files?.[0]; e.target.value = "";
            if (!f) return; try { const d = parseBackup(await f.text()); if (!confirm(`Replace ALL current data with "${f.name}"? This cannot be undone.`)) return; restore(d); setRes({ ok: true, t: `Restored backup from ${f.name}.` }); }
            catch (err) { setRes({ ok: false, t: `Import failed: ${err instanceof Error ? err.message : String(err)} Your data was not changed.` }); } }} /></label>
        <button className="flex items-center gap-2.5 min-[380px]:flex-col min-[380px]:items-start min-[380px]:gap-1.5 rounded-2xl bg-[var(--purpleSoft)] p-2.5 text-left" onClick={() => { try { download("MyFit_Backup.json", JSON.stringify(db, null, 2), "application/json"); setRes({ ok: true, t: "Backup downloaded as MyFit_Backup.json." }); } catch (err) { setRes({ ok: false, t: `Download failed: ${String(err)}` }); } }}><FileJson size={28} className="shrink-0 text-[var(--purple)]" aria-hidden /><span><b className="block text-[14px]">Download JSON</b><span className="text-[12.5px] text-[var(--mute)]">Full data backup</span></span></button></div>
      {res && <p role={res.ok ? "status" : "alert"} className={`mx-4 mb-2 rounded-xl px-3 py-2 text-sm font-semibold ${res.ok ? "bg-[var(--greenSoft)] text-[#14804F]" : "bg-[var(--redSoft)] text-[#B3342D]"}`}>{res.t}</p>}
      <div className="px-3 pb-3"><button className="flex w-full items-center gap-3 rounded-2xl bg-[var(--redSoft)] p-3 text-left" onClick={() => { setWord(""); setReset(true); }}>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#FFD9D4] text-[var(--red)]"><Trash2 size={22} aria-hidden /></span><span className="flex-1"><b className="block text-[15px]">Reset All Data</b><span className="text-[13px] text-[var(--mute)]">This will permanently delete all your data</span></span><ChevronRight size={20} className="text-[var(--mute)]" aria-hidden /></button></div>
    </Section>

    <Sheet open={reset} onClose={() => setReset(false)} title="Reset all data?">
      <div className="space-y-3"><p className="text-sm">This permanently deletes your profile, targets, workouts (including any food logs saved by earlier versions), water, supplements, measurements and plan on this device. If cloud sync is set up, the next sync will overwrite the cloud copy as well.</p>
        <button className="btn2 w-full" onClick={() => download("MyFit_Backup.json", JSON.stringify(db, null, 2), "application/json")}><Download size={18} aria-hidden />Download a backup first</button>
        <label className="block"><span className="lbl">Type RESET to confirm</span><input className="inp mt-1" value={word} onChange={e => setWord(e.target.value)} autoCapitalize="characters" /></label>
        <button disabled={word.trim() !== "RESET"} className="btn !bg-none !bg-[var(--red)] !shadow-none" onClick={() => { restore(seed); setReset(false); setRes({ ok: true, t: "All data was reset." }); }}>Delete everything</button></div>
    </Sheet>
  </>);
}
