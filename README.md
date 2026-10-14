# MyFit Tracker

**Your fitness journey, one day at a time.**

MyFit Tracker is a mobile-first fitness tracking web app built by [GreyNod Labs](https://greynodlabs.com). It tracks workouts, supplements, water and body measurements, keeps your data on your own device first, and can optionally sync it to a **private GitHub repository that you own**.

> **Project status.** The source is public at <https://github.com/greynoddigital/myfit-tracker>, but **no open-source licence has been chosen yet**, so the code is not yet licensed for reuse. A licence recommendation is in [docs/LICENSE_RECOMMENDATION.md](docs/LICENSE_RECOMMENDATION.md). See the [release checklist](docs/OPEN_SOURCE_RELEASE_CHECKLIST.md) for what is still pending.

## Features

Everything below exists in the current source code. (Food logging and the stretching, cycling and treadmill timers were removed in this version. Food records saved by earlier versions are not deleted: they stay in your JSON backups and cloud sync data, they just have no screen.)

- **Home dashboard**: today's workout, the 5- or 10-minute self-workout timer on gym days, any pending exercises, a week strip of the training cycle, water intake, daily protein and creatine Taken / Not taken check-ins, and a weekly check-in prompt.
- **Workouts**
  - A repeating seven-day training cycle (Hybrid Push, Hybrid Pull, Quad-Focused Legs, Rest, Upper Body, Glute and Hamstring-Focused Legs, Rest), editable under *Settings, Weekly Training Plan*.
  - Exercise library with muscle group and equipment, and logging of sets (weight and reps) with a "last time" reference.
  - **Leave**: marks today's session as *Skipped* (never Completed) and shifts the remaining schedule forward one day, after a confirmation.
  - **Sunday is a fixed rest day.** The scheduler never puts a gym workout on a Sunday. If the rotation would have, that workout is postponed to Monday (nothing is lost or duplicated). Existing data is migrated without resetting your rotation.
  - **Self-workout timer (Home only)**: one simple countdown for your own warm-up, with a **5 min** or **10 min** selector (5 min is the default). It is offered on gym days only, never on Sunday, and is not shown on the Workouts page. Pick a length, press Start, then Pause, Resume or Stop (Stop asks for confirmation). The length cannot be changed while a session is running or paused. It stores an end timestamp, so it stays accurate across page changes, a minimised browser, background-tab throttling and page refreshes, and shows an in-app alert once when it finishes (optional browser notification if you allow it). It cannot run while the browser is fully closed or the device is asleep; it shows the correct time when you return.
  - **Machine In Use**: temporarily defers the current exercise to a **Pending Exercises** list (also on Home) and moves on. Sets are kept, the exercise is not marked complete, and **Resume Exercise** returns to it.
  - **Repeat Set**: copies the last completed set's weight and reps into the next set form. You still confirm with *Complete Set*.
- **Water**: a full-width card with a progress ring, today's total against the daily goal, and quick-add buttons (+250 ml, +500 ml, +1 L). Daily totals are kept separately by date.
- **Supplements**: a full-width card below Water with protein and creatine, each with clear *Taken* / *Not taken* buttons per day (tap the selected button again to undo).
- **Body and progress**: weight and waist entry through the weekly check-in, and progress charts for strength, weight, waist and water.
- **Reports and backups**: weekly summary exported as Markdown, Excel export (selected range or all history), JSON backup and restore, and a typed-confirmation *Reset All Data*.
- **Optional cloud sync**: manual *Sync now* to your own private GitHub data repository through a server-side API route. Data is always saved on the device first.

## Quick start (local)

Requires Node.js 20 or newer and npm (the project was built and tested here on Node 22).

```bash
git clone https://github.com/greynoddigital/myfit-tracker.git
cd myfit-tracker
npm ci
npm run dev        # http://localhost:3000
```

The app works immediately with data stored in your browser. Cloud sync is optional and needs the environment variables below.

## Optional: cloud sync to your private data repo

1. Create a **private** GitHub repository for your data (for example `myfit-data`) and initialise it with a README so the `main` branch exists.
2. Create a **fine-grained personal access token** limited to **only that repository** with **Contents: Read and write**.
3. Copy `.env.example` to `.env.local` and fill in:

   | Variable | Meaning |
   |---|---|
   | `GITHUB_TOKEN` | Secret. The fine-grained token from step 2. |
   | `GITHUB_REPO` | `owner/name` of your private data repo. |
   | `GITHUB_BRANCH` | Branch holding the data (default `main`). |
   | `APP_PASSWORD` | Secret passphrase you choose. Required, or the API refuses all requests. |

4. Restart the dev server, open *Settings, Cloud Sync*, enter the app password and press *Sync now*.

Sync is **manual**: nothing is uploaded until you press *Sync now*. Data is written to `data/<name>.json` files in your data repo.

The full beginner-friendly walkthrough, including Vercel deployment, is in [docs/MyFit-Tracker-Complete-Setup-Guide.pdf](docs/MyFit-Tracker-Complete-Setup-Guide.pdf) (editable source: [Markdown](docs/MyFit-Tracker-Complete-Setup-Guide.md)).

## Deploying

The app is a standard Next.js project and has been built with `next build`. Deploying to Vercel (import the repo, add the four environment variables, deploy) is described step by step in the setup guide. Free-tier limits and plans change; check your host's current terms.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm test` | Unit tests (scheduler, Sunday rest, Leave, timer, pending, repeat set, supplements, exports, branding) |

`npm run lint` is present but ESLint is not configured in this project yet.

## Page metadata

The page title, description, Open Graph and Twitter tags describe MyFit Tracker and name GreyNod Labs as author and publisher (see `app/layout.tsx` and `lib/brand.ts`). Pages are deliberately marked `noindex`, because a deployed instance is a personal health tracker. No canonical URL or `og:url` is set: the app is not assumed to be hosted at `greynodlabs.com`, and the real public URL is deployment-specific.

## Security and privacy

MyFit Tracker can hold health-related information, so please read [SECURITY.md](SECURITY.md). In short:

- The GitHub token and app password are **server-side only** and are never sent to the browser. Do not give them a `NEXT_PUBLIC_` prefix.
- **Your deployment URL is public.** The page itself is served to anyone who visits; protection applies to the `/api/data` route, which requires `APP_PASSWORD`. That password is a single shared secret with no rate limiting, so choose a long, unique one. Do not rely on an unlisted URL.
- Your fitness data lives in your browser's local storage and, if you enable sync, in your private data repo. Keep that repo **private**.
- The app contains no analytics or tracking and makes no network requests other than to its own API route (which talks to GitHub from the server).
- Never commit `.env.local`, tokens, exports or backups.

## Troubleshooting

| Symptom | Likely cause and fix |
|---|---|
| *Sync failed* | Wrong app password, missing or expired token, wrong `GITHUB_REPO`, or the branch does not exist. Check the four variables and that the token's repository access and Contents permission are correct. |
| *Sync failed* right after entering a password | The app shows the same message for a wrong password. Check that it matches `APP_PASSWORD` exactly and that `APP_PASSWORD` is set on the server. |
| *Remote has newer data* | Another device synced first. Sync from the device with the newest data, or use *Keep my data and overwrite* only if you are sure. |
| Changes to `.env.local` ignored | Restart `npm run dev`. On Vercel, redeploy after editing variables. |
| `npm ci` fails | Use Node.js 20 or newer. |

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md). Improvements to the original project go to the canonical repository: <https://github.com/greynoddigital/myfit-tracker>.

## Creator and forks

MyFit Tracker is built by **[GreyNod Labs](https://greynodlabs.com)**, and the app footer reads "Built by GreyNod Labs". The original author of the project is **[Vishnu Prasad](https://vxnuprasad.github.io/)**, a cybersecurity student and developer who works on web development, cybersecurity projects and practical software tools.

- GreyNod Labs (cybersecurity and security testing): <https://greynodlabs.com>
- GreyNod Digital (web development and digital services): <https://greynoddigital.github.io>
- Original author's website: <https://vxnuprasad.github.io/>
- Original repository: <https://github.com/greynoddigital/myfit-tracker>

Anyone can run their own deployment. Independent deployments are operated by their own owners and are not necessarily maintained or endorsed by the original author. Operators can identify themselves in the footer; see [docs/ATTRIBUTION_AND_FORKS.md](docs/ATTRIBUTION_AND_FORKS.md).

## Licence

No licence has been selected yet; this section will be updated when one is added. Without a licence, default copyright law applies: others have no permission to reuse, modify or redistribute the code beyond what GitHub's Terms of Service allow (such as viewing and forking on GitHub). See [docs/LICENSE_RECOMMENDATION.md](docs/LICENSE_RECOMMENDATION.md).
