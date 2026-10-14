# Open-source release checklist

Review date: 2026-10-04. Statuses are **PASS**, **FAIL**, **NOT TESTED** or **REQUIRES APPROVAL**. A status is PASS only if it was actually checked; creating a file never counts. Nothing was pushed, deployed, published, revoked, or changed on GitHub, Vercel or the external websites.

## Summary of what blocks a public release

1. **No licence exists** and the canonical repository is **already public** (REQUIRES APPROVAL).
2. **Git history was not reviewed** (NOT TESTED) and probably contains personal profile values (see item 4).
3. Dependency advisories need a decision (REQUIRES APPROVAL).
4. The API password has no brute-force protection (documented risk, not fixed).
5. Final human approval (REQUIRES APPROVAL).

## Checklist

| # | Item | Status | Evidence and notes |
|---|---|---|---|
| 1 | **Licence status** | REQUIRES APPROVAL | No `LICENSE` file in the project. Recommendation (MIT) and alternatives in `docs/LICENSE_RECOMMENDATION.md`. Proposed text is staged in `docs/proposed-license/MIT.proposed.txt` and is **not active**. You must choose the licence and the copyright holder (individual or entity). GreyNod LLP is not named. |
| 2 | **Repository visibility** | REQUIRES APPROVAL | Observed on GitHub on the review date: `greynoddigital/myfit-tracker` is **Public**, 2 commits, no README or LICENSE in the file list, description "Personal fitness tracker built with Next.js", website field links a Vercel URL. Visibility was not changed. Decide whether it stays public. README and docs describe the status honestly (public, unlicensed). |
| 3 | **Personal data and secret scan (working tree)** | PASS | Pattern scan for GitHub, AWS, Slack, OpenAI-style keys, private keys and bearer tokens over all project files: none found. No `.env*` file other than `.env.example` (empty placeholders). **Personal data found and fixed:** `lib/seed.ts` held a real-looking profile (full date of birth, height, starting and goal weight) and `tests/export.test.ts` reused the same weight. Both replaced with neutral fictional values (`1990-01-01`, 170 cm, 70 kg, 65 kg). A unit test guards against reintroducing them. |
| 3b | **Old values still in the public repo** | REQUIRES APPROVAL | The edit above only affects the working copy. The public repository very likely still shows the old values until you push (and in its history afterwards). I could not confirm this: GitHub blocks automated reading of file pages. |
| 4 | **Git history review** | NOT TESTED | The project given to me has **no `.git` directory**, and GitHub blocked automated access to the public repo's files, so history was not scanned. Recommended (nothing was run or rewritten): in a full clone run `git log --all -p -- lib/seed.ts` (read the old `profile` line in each commit; `-S"<old date of birth>"` finds the commit that introduced it), `git log --all --diff-filter=A --name-only \| grep -i env`, and a scanner such as `gitleaks detect` or `trufflehog git file://.`. If a secret is found: revoke it first. If only the profile values are exposed, decide whether that is acceptable or whether to rewrite history (`git filter-repo`, force push, accept that existing forks and caches may keep copies). **Do not rewrite history without deciding this deliberately.** |
| 5 | **Authentication and API security review** | PASS (inspected) with unresolved risks below | Inspected `app/api/data/route.ts`, `lib/github.ts`, `lib/store.ts`, `components/Settings.tsx`, `components/Export.tsx`. Verified: token used server-side only; route returns 401 without the right `x-app-password`; missing `APP_PASSWORD` denies everything; file names restricted to a fixed allow-list; only the repo in `GITHUB_REPO` is addressed; stale writes rejected. See risk register. |
| 6 | **Secrets not in the client bundle** | PASS | Built with sentinel values for `GITHUB_TOKEN`, `GITHUB_REPO` and `APP_PASSWORD`; none appear in `.next/static` or the prerendered pages, and the strings `GITHUB_TOKEN`, `GITHUB_REPO` and `api.github.com` do not appear in any client chunk. Only `NEXT_PUBLIC_OPERATOR_NAME` and `NEXT_PUBLIC_OPERATOR_URL` use the public prefix (non-secret, optional). |
| 7 | **Import and export do not unexpectedly upload** | PASS (code inspection) | The only client network calls are `fetch("/api/data")` in `lib/store.ts`, triggered by *Sync now*. Excel export uses `xlsx` `writeFile` (download). Import validates JSON locally and asks for confirmation. A page-load test showed no third-party requests. Import and sync logic were inspected, not newly unit-tested. |
| 8 | **Creator attribution** | PASS | Footer, README, docs, page metadata and the PDF credit Vishnu Prasad. Footer verified at a 390 px mobile width: 48 checks (default) and 27 checks (operator mode) passed. See item 9 for the gated "Open source" label. |
| 8b | **"Open source" label in the footer** | REQUIRES APPROVAL | Deliberately **off** (`OPEN_SOURCE_CONFIRMED = false` in `lib/brand.ts`) because no licence exists. A plain "Source code" link is shown. After the licence is added, set it to `true`. |
| 9 | **Official brand links** | PASS | The four URLs were fetched on the review date and all responded. Exact values are asserted in `tests/brand.test.ts`. All footer links use `target="_blank"` with `rel="noopener noreferrer"`. |
| 10 | **SEO metadata** | PASS (what is implemented) | Title, description, Open Graph, Twitter card, author/creator, `icon.svg` and `apple-icon.png` are served (200, correct types). `noindex` is **kept on purpose**: a deployed instance is a personal health tracker. Discoverability comes from the README, GitHub and the brand sites rather than from search-indexing the app. |
| 10b | **Canonical URL, `og:url`, `og:image`** | REQUIRES APPROVAL | Not added: they need your confirmed production URL (the GitHub About field shows `myfit-tracker-beta.vercel.app`; please confirm whether that is the official one). Also moot while the app is `noindex`. |
| 11 | **Structured data** | PASS | None added to the app, deliberately: nothing visible on the app supports Person/Organization claims, and it must not imply a GreyNod product. Proposed `Person` and `Organization` JSON-LD for your sites is in `docs/EXTERNAL_SITES_RECOMMENDATIONS.md`. |
| 11b | **Changes to the three external sites** | REQUIRES APPROVAL | Not made. Recommendations written, including inconsistencies found (see that document). |
| 12 | **Sitemap and robots** | PASS | Intentionally **not added**: one private, `noindex` page plus a private API. A `robots.txt` disallow would stop crawlers from seeing `noindex`, and a sitemap would contradict it. Verified `/robots.txt` and `/sitemap.xml` return 404. |
| 13 | **PDF generation and verification** | PASS (document) | `docs/MyFit-Tracker-Complete-Setup-Guide.pdf`: opens, 9 pages, not encrypted, metadata set, 19 bookmarked chapters, all 19 chapter titles and 30 required strings found in extracted text, 3 pages inspected visually. Rebuild with `python3 docs/tools/build_setup_guide_pdf.py`. |
| 13b | **Guide steps verified against live GitHub and Vercel** | NOT TESTED | The GitHub token and Vercel steps follow the app's real configuration and common UI paths but were **not executed** on those sites (no accounts or deployments were touched). Menu names can change. Test the guide once end to end with a throwaway data repo. |
| 14 | **Local build and tests** | PASS | `tsc --noEmit` passes; `next build` passes (default and operator-env builds); **25/25 unit tests** (scheduler, Leave, migration, export, branding, neutral seed); **26/26 browser checks** for Leave, persistence and schedule (Chromium, production build). |
| 14b | **Lint** | NOT TESTED | `npm run lint` only starts an interactive ESLint setup; ESLint is not configured. No config was added. |
| 15 | **Scheduling, Leave and Sunday rest** | PASS | Cycle order, Leave, repeated Leave and week boundaries tested. With default alignment every Sunday and Thursday is Rest for 52 weeks. After a Leave the rest days move with the cycle, so Sunday is not guaranteed to be Rest; that is the intended cycle behaviour, not a fixed-weekday rule. |
| 16 | **Live cloud sync against GitHub** | NOT TESTED | No credentials were used. Verified locally: unauthenticated GET and PUT return 401 with a body that reveals nothing. |
| 17 | **Telemetry and tracking** | PASS | None in source; none in the served HTML; no third-party requests on page load. |
| 18 | **Dependency audit** (`npm audit`) | REQUIRES APPROVAL | 8 advisories (7 high, 1 moderate). Five are in the dev-only ESLint tooling chain (`eslint-config-next`, `@next/eslint-plugin-next`, `fast-glob`, `micromatch`, `braces`), not shipped. `next`/`postcss`: fix requires a Next.js major upgrade. `xlsx` (SheetJS 0.18.5): no fix on npm; the app only **writes** workbooks and never parses uploaded spreadsheets, which limits exposure, but consider a maintained alternative. No dependencies were changed. |
| 19 | **Screenshots** | NOT TESTED | None added. Add screenshots only from a throwaway profile with fictional data. |
| 20 | **Deployment verification** | NOT TESTED | No deployment performed and the existing Vercel deployment was not touched. |
| 21 | **GitHub repository settings** | REQUIRES APPROVAL | Description, topics (`docs/GITHUB_REPOSITORY_METADATA.md`), private vulnerability reporting (needed by `SECURITY.md`), secret scanning, push protection and Dependabot. |
| 22 | **Final human approval** | REQUIRES APPROVAL | Owner sign-off required before any push or announcement. |

## Risk register (found, documented, not fixed)

| Risk | Detail | Suggested fix |
|---|---|---|
| R1 No rate limiting | `/api/data` can be guessed at without limit. | Long passphrase now; later add rate limiting or platform protection. |
| R2 Non-constant-time compare | Password compared with `!==`. Low practical risk over the network, but easy to harden with `timingSafeEqual`. | Small code change (needs approval; would be covered by a new test). |
| R3 Password in `localStorage` | Readable by anyone with access to the browser profile or any script on the page. | Document (done); consider session-only storage. |
| R4 Public UI | The page is public; only the API is protected. | Document (done); consider hosting-level protection. |
| R5 Existing installations and the seed change | New installs and *Reset All Data* now start from neutral profile values. Existing saved data is untouched. **If you never edited your profile and it was never synced, a fresh device will show the neutral defaults instead of your old ones; re-enter them in Settings, Edit Profile.** | None needed; be aware. |

## Order of steps to finish the release (all need your approval)

1. Decide the licence and copyright holder; add `LICENSE`; set `OPEN_SOURCE_CONFIRMED = true`; update the README licence section; use the canonical sentence "MyFit Tracker is an open-source fitness tracking project created by Vishnu Prasad." in the README.
2. Scan the full Git history (item 4) and decide on remediation.
3. Decide on the dependency advisories (item 18).
4. Review and commit these changes, then push.
5. Update repository description, topics and security settings.
6. Confirm the production URL, then add canonical, `og:url` and an `og:image`.
7. Make the external-site changes you agree with.
8. Walk through the PDF guide once on a clean account with a throwaway data repo.
9. Final sign-off.
