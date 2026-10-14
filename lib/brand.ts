// Attribution & branding: ONE place to read (and, for forks, customise). No tracking, no remote content.
// The ORIGINAL block is a factual statement of who created the project; please keep it in forks.
// Deployment operators identify themselves with the optional NEXT_PUBLIC_OPERATOR_* variables (see docs/ATTRIBUTION_AND_FORKS.md).
// NEXT_PUBLIC_* values are shipped to every visitor's browser: never put secrets in them.
export const ORIGINAL = {
  product: "MyFit Tracker",
  tagline: "Your fitness journey, one day at a time.",
  creator: "Vishnu Prasad",
  creatorUrl: "https://vxnuprasad.github.io/",
  links: [
    { label: "Personal Website", href: "https://vxnuprasad.github.io/" },
    { label: "GreyNod Labs", href: "https://greynodlabs.com" },
    { label: "GreyNod Digital", href: "https://greynoddigital.github.io" },
  ],
  repoUrl: "https://github.com/greynoddigital/myfit-tracker",
  closing: "Built for healthier habits. Shared with everyone.",
  description: "A mobile-first fitness tracker for workouts, supplements, water and body measurements, built by GreyNod Labs.",
} as const;

// Publisher brand used by the footer and page metadata. It is a brand name only: no legal-entity claim is made.
export const PUBLISHER = { name: "GreyNod Labs", url: "https://greynodlabs.com" } as const;

// Shows the "Open source" label in the footer. Keep false until a licence has been chosen and added to the repo
// (see docs/OPEN_SOURCE_RELEASE_CHECKLIST.md). The plain "Source code" link is always shown.
export const OPEN_SOURCE_CONFIRMED = false;

/** Returns a normalised https URL, or undefined for anything else (http:, javascript:, URLs with credentials, junk). */
export function safeHttpsUrl(v?: string): string | undefined {
  if (!v) return undefined;
  try { const u = new URL(v.trim()); return u.protocol === "https:" && !u.username && !u.password ? u.toString() : undefined; } catch { return undefined; }
}
/** Optional "operated by" identity for an independent deployment. Name is required; URL is optional and must be https. */
export function operatorFrom(raw: { name?: string; url?: string }): { name: string; url?: string } | undefined {
  const name = (raw.name ?? "").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 60);
  return name ? { name, url: safeHttpsUrl(raw.url) } : undefined;
}
