# Suggested GitHub repository metadata

Nothing here has been applied. Visibility, description and topics are repository settings that only you can change (and the repository is **already public**).

## Description (about 200 characters)

> Mobile-first fitness tracker for workouts, food, water and body measurements. Next.js app with optional sync to your own private GitHub repo. Created by Vishnu Prasad.

Current description on GitHub: "Personal fitness tracker built with Next.js". The website field currently points to a Vercel URL (`myfit-tracker-beta.vercel.app`); decide whether that should stay, since it is the live deployment.

## Topics (each checked against the source)

`fitness-tracker`, `fitness-tracking`, `workout-tracker`, `nutrition-tracker`, `nextjs`, `react`, `typescript`, `tailwindcss`, `vercel`, `self-hosted`

- `self-hosted`: accurate in the sense that you run your own instance and keep your own data; it runs anywhere Node.js runs (`next start`), not only on Vercel.
- Add `open-source` **only after** a licence is added and approved.
- Not suggested: `pwa` (no web app manifest or service worker exists), `mobile-app` (it is a responsive web app).

## Repository settings to consider (all require you)

- Enable *private vulnerability reporting* (Settings, Code security) so `SECURITY.md` works.
- Add the licence file after approval; GitHub then shows the licence badge.
- Enable *secret scanning* and *push protection*, and Dependabot alerts.
- Add a social preview image if you create one without personal data.
