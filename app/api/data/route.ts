import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "@/lib/github";
const KEYS = ["profile","settings","weight","waist","food","foodLib","water","workouts","exercises","program","supplements"];
const deny = (req: NextRequest) => !process.env.APP_PASSWORD || req.headers.get("x-app-password") !== process.env.APP_PASSWORD;

export async function GET(req: NextRequest) {
  if (deny(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const out: Record<string, { sha: string; content: string } | null> = {};
    await Promise.all(KEYS.map(async k => { out[k] = await readFile(k); }));
    return NextResponse.json(out);
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 502 }); }
}
// Body: { key, content, sha }. Stale sha => 409, so newer remote data is never silently overwritten.
export async function PUT(req: NextRequest) {
  if (deny(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { key, content, sha } = await req.json();
  if (!KEYS.includes(key)) return NextResponse.json({ error: "bad key" }, { status: 400 });
  try {
    const r = await writeFile(key, JSON.stringify(content, null, 2), sha || undefined);
    return "conflict" in r ? NextResponse.json({ error: "conflict" }, { status: 409 }) : NextResponse.json(r);
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 502 }); }
}
