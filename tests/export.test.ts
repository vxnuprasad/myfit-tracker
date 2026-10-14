import test from "node:test"; import assert from "node:assert/strict";
import * as X from "xlsx"; import { buildWorkbook } from "../lib/export"; import { seed } from "../lib/seed";
const db = { ...seed, weight: [{ date: "2026-09-01", kg: 71 }, { date: "2026-10-01", kg: 70, note: "ok" }], waist: [{ date: "2026-10-01", cm: 82 }],
  food: [{ id: "1", date: "2026-10-02", meal: "Lunch" as const, name: "Rice", qty: 1, unit: "serving", kcal: 200, p: 4, c: 40, f: 1, est: true }, { id: "2", date: "2026-10-02", meal: "Dinner" as const, name: "Egg", qty: 2, unit: "egg", kcal: 140, p: 12, c: 1, f: 10, est: false }],
  water: { "2026-10-02": ["250@2026-10-02T08:00:00Z", "500@2026-10-02T12:00:00Z"] },
  workouts: [{ id: "w", date: "2026-10-02", day: "Push", notes: "", finished: true, prep: { warm: { kind: "Cycling", sec: 600, status: "done" as const } }, exercises: [{ name: "Bench", sets: [{ n: 1, kg: 40, reps: 8, done: true, ts: "" }] }] }] };
const wb = buildWorkbook(db, "2026-09-27", "2026-10-03"), rows = (n: string) => X.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[n]);
test("sheets: food/nutrition sheets are gone, the rest remain", () => { assert.equal(wb.SheetNames.length, 7); assert.ok(!wb.SheetNames.some(n => /food|nutrition/i.test(n))); assert.ok(wb.SheetNames.includes("Water Intake")); });
test("removed food feature never mutates stored food records", () => { assert.equal(db.food.length, 2); assert.equal(db.food[0].kcal, 200); });
test("water sums ml", () => assert.equal(rows("Water Intake")[0].Daily_total_ml, 750));
test("measurement history includes out-of-range rows flagged", () => assert.deepEqual(rows("Weight Measurements").map(r => r.In_period), ["no", "yes"]));
test("workout and sets", () => { assert.equal(rows("Exercise Sets").length, 1); assert.match(String(rows("Workouts")[0].Warmup), /Cycling done 10 min/); });
test("round-trips through xlsx file", () => { X.writeFile(wb, "/tmp/rt.xlsx"); assert.equal(X.readFile("/tmp/rt.xlsx").SheetNames[0], "Weekly Summary"); });
