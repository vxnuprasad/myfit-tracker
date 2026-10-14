import { PUBLISHER } from "@/lib/brand";

/** Minimal footer. The page wrapper already reserves space above the bottom navigation, so it never overlaps it. */
export default function Footer() {
  return (
    <footer className="mx-4 mt-4 pb-1 text-center text-[12px] text-[var(--mute)]">
      Built by{" "}
      <a href={PUBLISHER.url} target="_blank" rel="noopener noreferrer" aria-label={`${PUBLISHER.name} (opens in a new tab)`}
        className="font-semibold text-[#9A4A1E] underline underline-offset-2 hover:text-[var(--acc)]">{PUBLISHER.name}</a>
    </footer>
  );
}
