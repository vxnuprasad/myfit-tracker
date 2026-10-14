# Contributing to MyFit Tracker

Thanks for helping improve MyFit Tracker. Improvements to the original project are best sent upstream to the canonical repository: <https://github.com/greynoddigital/myfit-tracker>.

> **Licence note.** No licence has been selected yet (see [docs/LICENSE_RECOMMENDATION.md](docs/LICENSE_RECOMMENDATION.md)). Until the maintainer adds one, please open an issue to discuss a change before sending a pull request, so that the terms for contributions are clear.

## Getting set up

```bash
git clone https://github.com/<your-username>/myfit-tracker.git   # your fork
cd myfit-tracker
npm ci
npm run dev
```

Cloud sync is optional. You can develop everything else without any environment variables. If you do test sync, use a **throwaway private repo and a token scoped only to it**, never real health data.

## Before you open a pull request

```bash
npx tsc --noEmit    # type check
npm test            # unit tests
npm run build       # production build
```

All three should pass. Add or update tests in `tests/` for behaviour you change, especially anything touching `lib/util.ts` (the scheduler and Leave logic) or `lib/export.ts`.

## Ground rules

- **Keep the design.** The orange-and-cream visual style, layouts and navigation are intentional. Propose visual changes in an issue first.
- **One scheduler.** Everything that shows "what is planned on date X" must read it through `planFor` / `idxFor` in `lib/util.ts`. Do not add a second scheduler.
- **Never delete user data in a migration.** Migrations must be additive and idempotent (see `migrateSchedule`).
- **Accessibility and mobile.** Keep visible focus states, keyboard access, 44 px touch targets and space above the bottom navigation.
- **No tracking.** Do not add analytics, telemetry, remote scripts or hidden network calls. Any new network call must be documented in the PR.
- **No secrets, no personal data.** Never commit `.env.local`, tokens, backups, exports, screenshots with real records, or real personal measurements. Use neutral fictional data in examples and tests.
- **Server-only secrets.** `GITHUB_TOKEN` and `APP_PASSWORD` must stay server-side and must never get a `NEXT_PUBLIC_` prefix.
- **Attribution stays accurate.** Do not remove the original-author credit in `README.md` or `lib/brand.ts`. See [docs/ATTRIBUTION_AND_FORKS.md](docs/ATTRIBUTION_AND_FORKS.md).

## Pull request process

1. Fork, branch from `main`, make a focused change.
2. Run the three checks above.
3. Open a PR using the template and describe what you tested.
4. A maintainer reviews. Small, well-tested PRs are easiest to merge.

## Reporting bugs and ideas

Use the issue templates. For **security problems**, do not open a public issue; follow [SECURITY.md](SECURITY.md).
