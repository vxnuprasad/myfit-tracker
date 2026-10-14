import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { ORIGINAL as O, PUBLISHER as P } from "@/lib/brand";
// Deliberately noindex: a deployed instance is a personal health tracker, so it should not appear in search results.
// No canonical URL, og:url or og:image yet: they need the confirmed production URL (see docs/OPEN_SOURCE_RELEASE_CHECKLIST.md).
const title = `${O.product}: Workout, Water & Supplement Tracker`;
export const metadata: Metadata = {
  title, description: O.description, applicationName: O.product,
  authors: [{ name: P.name, url: P.url }], creator: P.name, publisher: P.name, robots: "noindex",
  openGraph: { type: "website", siteName: O.product, title, description: O.description },
  twitter: { card: "summary", title, description: O.description },
};
// viewport-fit=cover lets the bottom bar extend under the iOS home indicator; env(safe-area-inset-*) keeps content clear of it.
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#FFF9F3" };
export default function Root({ children }: { children: React.ReactNode }) {
  return (<html lang="en" suppressHydrationWarning><body>{children}</body></html>);
}
