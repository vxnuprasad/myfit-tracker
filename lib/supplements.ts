import { DB } from "./types";
export type SuppKey = "protein" | "creatine";
/** Sets (true = Taken, false = Not taken) or clears (undefined) one supplement for ONE date. Other dates and the other supplement are untouched. */
export function setSupplement(d: DB, date: string, key: SuppKey, value: boolean | undefined): DB {
  const day = { ...d.supplements?.[date] };
  if (value === undefined) delete day[key]; else day[key] = value;
  return { ...d, supplements: { ...d.supplements, [date]: day } };
}
