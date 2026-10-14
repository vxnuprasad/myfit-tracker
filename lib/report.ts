import { DB } from "./types";
const NR = "Not recorded";
const avg = (a: number[]) => (a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : NR);
export const weekDates = (start: string) => Array.from({ length: 7 }, (_, i) => { const d = new Date(start + "T12:00:00"); d.setDate(d.getDate() + i); return d.toLocaleDateString("en-CA"); });

export function weeklyMarkdown(db: DB, start: string) {
  const days = weekDates(start), inW = (d: string) => days.includes(d);
  const w = db.weight.filter(x => inW(x.date)).sort((a, b) => a.date.localeCompare(b.date));
  const waist = w.filter(x => x.waist != null);
  const ws = db.workouts.filter(x => inW(x.date));
  const sets = ws.flatMap(x => x.exercises.filter(e => !e.skipped).flatMap(e => e.sets.filter(s => s.done).map(s => ({ ...s, ex: e.name }))));
  const bottles = days.map(d => (db.water[d] || []).length);
  const tgt = db.settings.bottleTarget;
  const chg = w.length > 1 ? (w[w.length - 1].kg - w[0].kg).toFixed(1) + " kg" : NR;
  const lines = [
    "# MyFit Weekly Report", "", "## Reporting Period", `${days[0]} to ${days[6]}`, "",
    "## Profile", `Goal weight: ${db.profile.goalKg} kg`, `Height: ${db.profile.heightCm} cm`, "",
    "## Body Metrics",
    `Starting weight: ${w[0]?.kg ?? NR}`, `Ending weight: ${w.at(-1)?.kg ?? NR}`, `Average weight: ${avg(w.map(x => x.kg))}`, `Weight change: ${chg}`,
    `Starting waist: ${waist[0]?.waist ?? NR}`, `Ending waist: ${waist.at(-1)?.waist ?? NR}`, "",
    "## Workout Summary", `Sessions: ${ws.length}`, `Total sets: ${sets.length}`, `Total reps: ${sets.reduce((a, s) => a + s.reps, 0)}`, "",
    "## Exercise Progression",
  ];
  const names = [...new Set(sets.map(s => s.ex))];
  if (!names.length) lines.push(NR);
  for (const n of names) {
    const all = sets.filter(s => s.ex === n).sort((a, b) => a.ts.localeCompare(b.ts));
    const f = all[0], l = all.at(-1)!;
    lines.push(`### ${n}`, `First set: ${f.kg} kg x ${f.reps}`, `Last set: ${l.kg} kg x ${l.reps}`, `Top set: ${Math.max(...all.map(s => s.kg))} kg`, "");
  }
  lines.push("## Water", `Daily target: ${tgt} bottles (${tgt * db.settings.bottleL} L)`, `Total bottles: ${bottles.reduce((a, b) => a + b, 0)}`,
    `Average bottles/day: ${(bottles.reduce((a, b) => a + b, 0) / 7).toFixed(1)}`, `Days target met: ${bottles.filter(b => b >= tgt).length}/7`, "",
    "## Daily Log", ...days.map((d, i) => `- ${d}: weight ${w.find(x => x.date === d)?.kg ?? NR}; bottles ${bottles[i]}; workout ${ws.find(x => x.date === d)?.day ?? "None"}`), "",
    "## User Notes", ...([...w.filter(x => x.note).map(x => `- ${x.date}: ${x.note}`), ...ws.filter(x => x.notes).map(x => `- ${x.date} (${x.day}): ${x.notes}`)].length
      ? [...w.filter(x => x.note).map(x => `- ${x.date}: ${x.note}`), ...ws.filter(x => x.notes).map(x => `- ${x.date} (${x.day}): ${x.notes}`)] : [NR]),
    "", "## Questions / Issues", "Not recorded");
  return lines.join("\n");
}
export const download = (name: string, text: string, type = "text/markdown") => {
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); URL.revokeObjectURL(a.href);
};
