import * as XLSX from "xlsx";
import { DB } from "./types";
const ml = (x: string, db: DB) => (x.includes("@") ? parseInt(x) : db.settings.bottleL * 1000);
const r1 = (n: number) => Math.round(n * 10) / 10;
// Food logging was removed from the app. Old food records are NOT deleted: they stay in db.food / JSON backups / cloud sync.
export function buildWorkbook(db: DB, from: string, to: string) {
  const dr = (a: string, b: string) => { const o: string[] = []; for (let d = new Date(a + "T12:00:00"); d.toLocaleDateString("en-CA") <= b; d.setDate(d.getDate() + 1)) o.push(d.toLocaleDateString("en-CA")); return o; };
  const inR = (d: string) => d >= from && d <= to;
  const wt = [...db.weight].sort((a, b) => a.date.localeCompare(b.date)), wa = [...db.waist, ...db.weight.filter(x => x.waist).map(x => ({ date: x.date, cm: x.waist! }))].sort((a, b) => a.date.localeCompare(b.date));
  const wk = db.workouts.filter(w => inR(w.date));
  const wtot = (d: string) => (db.water[d] || []).reduce((a, x) => a + ml(x, db), 0);
  const water = Object.keys(db.water).filter(inR).sort().flatMap(d => db.water[d].map(x => ({ Date: d, Time: x.split("@")[1] || x, Amount_ml: ml(x, db), Daily_total_ml: wtot(d), Legacy_bottle_entry: x.includes("@") ? "no" : "yes" })));
  const inW = <T extends { date: string }>(a: T[]) => a.filter(x => inR(x.date));
  const avg = (a: number[]) => (a.length ? r1(a.reduce((x, y) => x + y, 0) / a.length) : "not recorded");
  const sets = wk.flatMap(w => w.exercises.flatMap(e => e.sets.map(s => ({ Date: w.date, Workout: w.day, Exercise: e.name, Exercise_skipped: e.skipped ? "yes" : "no", Set: s.n, Weight_kg: s.kg, Reps: s.reps, RPE: s.rpe ?? "", Completed: s.done ? "yes" : "no", Note: s.note ?? "" }))));
  const summary = [["Period start", from], ["Period end", to], ["Weight entries in period", inW(wt).length], ["Weight first in period (kg)", inW(wt)[0] ? inW(wt)[0].kg : "not recorded"], ["Weight last in period (kg)", inW(wt).at(-1) ? inW(wt).at(-1)!.kg : "not recorded"],
    ["Waist entries in period", inW(wa).length], ["Waist last in period (cm)", inW(wa).at(-1) ? inW(wa).at(-1)!.cm : "not recorded"], ["Workouts finished", wk.filter(w => w.finished).length], ["Completed sets", sets.filter(s => s.Completed === "yes").length],
    ["Water total in period (ml)", Object.keys(db.water).filter(inR).reduce((a, d) => a + wtot(d), 0)], ["Note", "Unrecorded days are left blank, not filled. Weight/Waist sheets include all history for context (see In_period)."]];
  const s = db.settings, tgt = [["Water target (ml)", s.waterTargetMl ?? s.bottleTarget * s.bottleL * 1000], ["Goal weight (kg)", db.profile.goalKg], ["Height (cm)", db.profile.heightCm], ["Weekly check-in day", ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][s.checkinDay ?? 1]]];
  const wb = XLSX.utils.book_new(), add = (n: string, rows: object[] | unknown[][], aoa = false) => XLSX.utils.book_append_sheet(wb, (() => { const ws = aoa ? XLSX.utils.aoa_to_sheet([["Item", "Value"], ...(rows as unknown[][])]) : XLSX.utils.json_to_sheet(rows.length ? (rows as object[]) : [{ Info: "No records in this period" }]); const hdr = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 }); const wd = ((hdr[0] as unknown[]) || []).map((_, c) => ({ wch: Math.min(40, Math.max(10, ...hdr.map(r => String((r as unknown[])[c] ?? "").length + 2))) })); ws["!cols"] = wd; return ws; })(), n);
  add("Weekly Summary", summary, true);
  add("Weight Measurements", wt.map(x => ({ Date: x.date, Weight_kg: x.kg, Unit: "kg", In_period: inR(x.date) ? "yes" : "no", Note: x.note ?? "" })));
  add("Waist Measurements", wa.map(x => ({ Date: x.date, Waist_cm: x.cm, Unit: "cm", In_period: inR(x.date) ? "yes" : "no" })));
  add("Workouts", wk.map(w => ({ Date: w.date, Workout: w.day, Finished: w.finished ? "yes" : "no", Started: w.startedAt ?? "", Finished_at: w.finishedAt ?? "", Warmup: w.prep?.warm ? `${w.prep.warm.kind} ${w.prep.warm.status} ${Math.round(w.prep.warm.sec / 60)} min` : "not recorded", Stretching: w.prep?.stretch ? `${w.prep.stretch.status} ${Math.round(w.prep.stretch.sec / 60)} min` : "not recorded", Notes: w.notes })));
  add("Exercise Sets", sets);
  add("Water Intake", water); add("Targets and Settings", tgt, true);
  return wb;
}
export const exportName = (from: string, to: string, all = false) => (all ? `MyFitTracker_AllHistory_${to}.xlsx` : from === to ? `MyFitTracker_${to}.xlsx` : `MyFitTracker_Weekly_${to}.xlsx`);
export const allRange = (db: DB, to: string) => [...db.weight.map(x => x.date), ...db.waist.map(x => x.date), ...db.workouts.map(x => x.date), ...Object.keys(db.water), to].sort()[0];
