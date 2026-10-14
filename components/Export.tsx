"use client";
import { useState } from "react";
import { DB } from "@/lib/types";
import { today } from "@/lib/store";
const ago = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toLocaleDateString("en-CA"); };
export default function Export({ db }: { db: DB }) {
  const [from, setFrom] = useState(ago(6)), [to, setTo] = useState(today()), [msg, setMsg] = useState(""), [busy, setBusy] = useState(false);
  const run = async (a: string, b: string, all = false) => { if (a > b) return setMsg("Start date must be before the end date."); setBusy(true); setMsg("");
    try { const [{ buildWorkbook, exportName }, X] = await Promise.all([import("@/lib/export"), import("xlsx")]); X.writeFile(buildWorkbook(db, a, b), exportName(a, b, all)); setMsg(`Exported ${exportName(a, b, all)} (${a} to ${b}). Your data was not changed.`); }
    catch (e) { setMsg(`Export failed: ${String(e)}`); } setBusy(false); };
  return (<div className="space-y-2"><button className="btn" disabled={busy} onClick={() => run(ago(6), today())}>Export weekly data (last 7 days)</button>
    <div className="grid grid-cols-2 gap-2"><label className="lbl block">From<input type="date" className="inp mt-1" value={from} onChange={e => setFrom(e.target.value)} /></label><label className="lbl block">To<input type="date" className="inp mt-1" value={to} onChange={e => setTo(e.target.value)} /></label></div>
    <button className="btn2 w-full" disabled={busy} onClick={() => run(from, to)}>Export selected range</button><button className="btn2 w-full" disabled={busy} onClick={async () => { const { allRange } = await import("@/lib/export"); run(allRange(db, today()), today(), true); }}>Export all history</button>{msg && <p role="status" className="text-sm">{msg}</p>}</div>);
}
