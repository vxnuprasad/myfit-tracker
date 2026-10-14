"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { DB } from "./types";
import { seed } from "./seed";
import { migrateSchedule, migrateSundayRest } from "./util";

const K = "myfit-db", S = "myfit-sha", D = "myfit-dirty", P = "myfit-pw", T = "myfit-last";
export type SyncState = "idle" | "syncing" | "ok" | "failed" | "conflict";
export const today = () => new Date().toLocaleDateString("en-CA");
const load = <T,>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) || "") as T; } catch { return d; } };

export function useDB() {
  const [db, setDb] = useState<DB>(seed);
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<SyncState>("idle");
  const [last, setLast] = useState("");
  const dirty = useRef<Set<string>>(new Set());
  const shas = useRef<Record<string, string>>({});

  useEffect(() => {
    shas.current = load(S, {}); dirty.current = new Set(load<string[]>(D, []));
    // One-time schedule reset (guarded by settings.scheduleV). Saved locally + marked dirty like any other change.
    const m1 = migrateSchedule({ ...seed, ...load<Partial<DB>>(K, {}) });
    // One-time, non-destructive: record the date from which Sunday is a fixed rest day (see lib/util.ts).
    const m2 = migrateSundayRest(m1.db, today()), loaded = m2.db, keys = [...new Set([...m1.keys, ...m2.keys])];
    if (keys.length) { localStorage.setItem(K, JSON.stringify(loaded)); keys.forEach(k => dirty.current.add(k)); localStorage.setItem(D, JSON.stringify([...dirty.current])); }
    setDb(loaded);
    setLast(localStorage.getItem(T) || ""); setReady(true);
  }, []);

  // Every change is saved locally first, so a network failure never loses data.
  const update = useCallback((fn: (d: DB) => DB, keys: (keyof DB)[]) => {
    setDb(prev => {
      const next = fn(prev);
      localStorage.setItem(K, JSON.stringify(next));
      keys.forEach(k => dirty.current.add(k));
      localStorage.setItem(D, JSON.stringify([...dirty.current]));
      return next;
    });
  }, []);

  const sync = useCallback(async (force = false) => {
    const pw = localStorage.getItem(P) || "";
    const hd = { "x-app-password": pw, "Content-Type": "application/json" };
    setState("syncing");
    try {
      const res = await fetch("/api/data", { headers: hd });
      if (!res.ok) throw new Error(String(res.status));
      const remote = await res.json() as Record<string, { sha: string; content: string } | null>;
      const merged: Record<string, unknown> = {};
      for (const [k, r] of Object.entries(remote)) {
        const isDirty = dirty.current.has(k);
        if (r && r.sha !== shas.current[k]) {
          if (isDirty && !force) { setState("conflict"); return; }
          if (!isDirty) { merged[k] = JSON.parse(r.content); shas.current[k] = r.sha; }
          else shas.current[k] = r.sha; // force: keep mine, adopt remote sha
        }
      }
      if (Object.keys(merged).length) setDb(p => {
        // Remote data saved by an older version may lack sundayRestFrom: add it (and mark settings for upload) rather than lose the rule.
        const m = migrateSundayRest({ ...p, ...merged } as DB, today()); m.keys.forEach(k => dirty.current.add(k));
        localStorage.setItem(K, JSON.stringify(m.db)); localStorage.setItem(D, JSON.stringify([...dirty.current])); return m.db; });
      const cur = load<DB>(K, seed) as unknown as Record<string, unknown>;
      for (const k of [...dirty.current]) {
        const r = await fetch("/api/data", { method: "PUT", headers: hd, body: JSON.stringify({ key: k, content: cur[k], sha: shas.current[k] }) });
        if (r.status === 409) { setState("conflict"); return; }
        if (!r.ok) throw new Error(String(r.status));
        shas.current[k] = (await r.json()).sha; dirty.current.delete(k);
      }
      localStorage.setItem(S, JSON.stringify(shas.current)); localStorage.setItem(D, JSON.stringify([...dirty.current]));
      const t = new Date().toLocaleString(); localStorage.setItem(T, t); setLast(t); setState("ok");
    } catch { setState("failed"); }
  }, []);

  const restore = (raw: DB) => { const d = migrateSundayRest(raw, today()).db; setDb(d); localStorage.setItem(K, JSON.stringify(d)); dirty.current = new Set(Object.keys(d)); localStorage.setItem(D, JSON.stringify([...dirty.current])); };
  return { db, ready, update, sync, state, last, restore };
}
export const setPassword = (v: string) => localStorage.setItem(P, v);
