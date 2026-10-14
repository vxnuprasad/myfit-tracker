// SERVER ONLY. Token never reaches the browser.
const base = () => `https://api.github.com/repos/${process.env.GITHUB_REPO}/contents`;
const h = () => ({ Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: "application/vnd.github+json", "User-Agent": "myfit" });
const ref = () => process.env.GITHUB_BRANCH || "main";

export async function readFile(name: string) {
  const r = await fetch(`${base()}/data/${name}.json?ref=${ref()}`, { headers: h(), cache: "no-store" });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`GitHub read ${r.status}`);
  const j = await r.json();
  return { sha: j.sha as string, content: Buffer.from(j.content, "base64").toString("utf8") };
}
export async function writeFile(name: string, content: string, sha?: string) {
  const r = await fetch(`${base()}/data/${name}.json`, {
    method: "PUT", headers: h(),
    body: JSON.stringify({ message: `sync ${name}`, content: Buffer.from(content).toString("base64"), branch: ref(), sha }),
  });
  if (r.status === 409 || r.status === 422) return { conflict: true as const };
  if (!r.ok) throw new Error(`GitHub write ${r.status}`);
  return { sha: (await r.json()).content.sha as string };
}
