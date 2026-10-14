# Security Policy

MyFit Tracker can store health-related information (weight, measurements, food, workouts), so please treat deployments accordingly.

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

- Preferred: use GitHub's private vulnerability reporting on the repository's *Security* tab (**the maintainer must enable this setting; see the release checklist**).
- Alternative: contact the maintainer through the contact form on <https://vxnuprasad.github.io/> and say it is a security report. Do not include exploit details or real personal data in a first message.

Please give the maintainer reasonable time to respond and fix the issue before disclosing it publicly. This is a personal open-source project: there is no guaranteed response time, no bug bounty and no service-level agreement.

## What the application does and does not protect (as inspected in the source)

**Verified in the code:**

- `GITHUB_TOKEN` is read only in `lib/github.ts`, which is imported only by the server route `app/api/data/route.ts`. No `NEXT_PUBLIC_` variable carries a secret.
- The API route refuses every request (HTTP 401) unless the `x-app-password` header equals the `APP_PASSWORD` environment variable. If `APP_PASSWORD` is unset, all requests are refused.
- The route only reads and writes a fixed allow-list of file names (`profile`, `settings`, `weight`, `waist`, `food`, `foodLib`, `water`, `workouts`, `exercises`, `program`, `supplements`) as `data/<name>.json` in the single repository named by `GITHUB_REPO`. File names cannot be chosen freely by a caller.
- Writes use the file's SHA, so a stale write is rejected with HTTP 409 instead of silently overwriting newer data.
- Import (JSON backup) is parsed and validated in the browser and replaces local data only after confirmation. Export (Excel, Markdown, JSON) is generated in the browser and downloaded. Import and export upload nothing by themselves; if sync is enabled, restored data is sent to your data repo only when you next press *Sync now*.
- The app includes no analytics or tracking code.

**Limits you should know about:**

- **The deployment URL is public.** The app's pages are served to anyone who visits. Only the `/api/data` route is password-protected. An unlisted URL or `robots.txt` is not access control.
- `APP_PASSWORD` is a single shared secret compared with a normal string comparison. There is **no rate limiting, lockout or per-user accounts**, so a short password can be guessed. Use a long, unique passphrase.
- The password you type in *Settings, Cloud Sync* is stored in this browser's local storage on that device. Anyone with access to the unlocked device or browser profile (or any script running on the page) can read it.
- Data in the browser's local storage is not encrypted.
- Anyone who has the password can read and overwrite all synced data.
- `npm audit` currently reports advisories in dependencies. See the release checklist for the current list and assessment.

## Keep these private

Never publish: GitHub tokens, `.env.local`, your private data repository, exported spreadsheets, JSON backups, or screenshots showing real records. Keep the data repository **private**. If a token is ever exposed, revoke it in GitHub immediately and create a new one.
