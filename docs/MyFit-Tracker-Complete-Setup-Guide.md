# MyFit Tracker - Complete Setup Guide

An installation, configuration and usage guide for MyFit Tracker, a fitness tracking project created by Vishnu Prasad.

> **Read this first. Seven rules that protect your data.**
> 1. Never commit `.env.local` or any credential to Git.
> 2. Never share your GitHub token, and never paste it into chat, screenshots or issues.
> 3. Never make your fitness-data repository public. Keep it private.
> 4. Never put a secret in a client-side variable. Anything starting with `NEXT_PUBLIC_` is shown to every visitor.
> 5. A deployment URL is not an access-control mechanism. Anyone who finds the URL can open the pages.
> 6. Before you store sensitive data, verify which routes are protected (Chapter 17 explains what is and is not).
> 7. Keep regular backups, and do not share screenshots or exports that contain private data.
>
> Free hosting plans and service limits may change. Always check the current terms of GitHub and Vercel.

## 1. Introduction and project overview

MyFit Tracker is a mobile-first web app for tracking workouts, food, water and body measurements. It is built with Next.js and React.

How your data is handled:

- **Local first.** Everything you enter is saved in your browser on your device straight away. The app works without any server setup.
- **Optional cloud sync.** If you configure it, you can press *Sync now* to copy your data to a **private GitHub repository that you own**. A small server route (`/api/data`) does this using a token that never reaches your browser.
- **No tracking.** The app contains no analytics or telemetry. Its only network traffic is to its own `/api/data` route, which talks to GitHub from the server.

What the app includes: a Home dashboard, a repeating seven-day training cycle with set logging, a Leave button to skip a day, a food log with your own macros, water quick-add, weight and waist logs, progress charts, a weekly summary, Excel export, JSON backup and restore.

How the pieces fit together:

1. **Source repository** (the code). You fork or clone it. It contains no personal data.
2. **Data repository** (your records). A separate **private** repo that only you control.
3. **Hosting** (optional). Vercel runs the app so you can use it from your phone.

## 2. Prerequisites

- A computer with **Node.js 20 or newer** and **npm** (npm comes with Node.js). Download Node.js from nodejs.org and choose the LTS version.
- **Git**, to download and upload code.
- A **GitHub account** (free is fine).
- A **Vercel account** if you want to host it online (optional; you can run it locally).
- A code editor such as VS Code (optional but helpful).

Check your tools by running these in a terminal:

```
node -v
npm -v
git --version
```

## 3. Creating or accessing a GitHub account

1. Go to github.com and choose *Sign up*, or *Sign in* if you already have an account.
2. Verify your email address.
3. Turn on two-factor authentication: GitHub, then Settings, then *Password and authentication*. This protects the account that holds your tokens and data.

## 4. Forking or cloning the source repository

The canonical source is <https://github.com/greynoddigital/myfit-tracker>.

**Option A: fork (simple, keeps a link to upstream).**

1. Open the repository and choose *Fork*, then *Create fork*.
2. Your copy appears under your account. Note that a fork of a public repository is itself public. That is fine because the source contains no secrets, but never put secrets in it.

**Option B: private copy.** Clone the repository, create a new **private** empty repository on GitHub, then push to it (see Chapter 10).

Download the code to your computer (replace `YOUR-USERNAME`):

```
git clone https://github.com/YOUR-USERNAME/myfit-tracker.git
cd myfit-tracker
npm ci
```

`npm ci` installs the exact dependency versions recorded in `package-lock.json`.

> **Licence note.** At the time this guide was written, the project had not yet chosen an open-source licence. Check the repository's `README.md` and `LICENSE` file for the current terms before you reuse or redistribute the code.

## 5. Creating the separate private fitness-data repository

This repository stores your personal records as JSON files. It must be private.

1. On GitHub choose *New repository*.
2. Name it, for example, `myfit-data`.
3. Set visibility to **Private**.
4. Tick *Add a README file*. This matters: the branch must already exist before the app can write to it.
5. Choose *Create repository*.

The app will create a `data/` folder in this repo on the first sync, with files such as `data/workouts.json` and `data/food.json`. You do not create these by hand.

> **Warning:** never make this repository public and never invite people you do not trust. It contains your health-related records.

## 6. Creating a fine-grained GitHub personal access token

The app needs a token so the server can read and write only your data repository. Create a **fine-grained** token (not a classic token).

1. On GitHub open your profile menu, then *Settings*, then *Developer settings*, then *Personal access tokens*, then *Fine-grained tokens*, then *Generate new token*. (Menu names can change slightly over time.)
2. **Token name:** `myfit-sync`.
3. **Expiration:** choose a limited lifetime, for example 90 days, and add a reminder to renew it.
4. **Resource owner:** your own account.
5. **Repository access:** choose *Only select repositories* and select **only** your data repository (for example `myfit-data`). Do not choose *All repositories*.
6. **Permissions:** under *Repository permissions* set **Contents** to **Read and write**. *Metadata: Read-only* is added automatically. Nothing else is needed, because the app only reads and writes files through the repository contents API.
7. Choose *Generate token* and copy the value now. GitHub shows it only once.

Store the token only in `.env.local` and in Vercel's environment variables. Never in Git, chat, screenshots or notes that sync to the cloud.

## 7. Configuring local environment variables

In the project folder, copy the example file:

```
cp .env.example .env.local
```

On Windows PowerShell use `Copy-Item .env.example .env.local`.

Open `.env.local` in an editor. The file `.env.local` is already listed in `.gitignore`, so Git will not upload it. Still, double-check before every commit (Chapter 10).

## 8. Configuring APP_PASSWORD, GITHUB_TOKEN, GITHUB_REPO and GITHUB_BRANCH

Fill in the four values exactly as follows:

| Variable | What to enter |
|---|---|
| `GITHUB_TOKEN` | The fine-grained token from Chapter 6. Secret. |
| `GITHUB_REPO` | Your data repo as `owner/name`, for example `your-username/myfit-data`. This is the data repo, not the source repo. |
| `GITHUB_BRANCH` | The branch in the data repo. Use `main` unless yours is different. If left empty the app uses `main`. |
| `APP_PASSWORD` | A long, unique passphrase that you invent (for example four or more random words). Secret. |

Example shape (use your own values, never copy these):

```
GITHUB_TOKEN=your-fine-grained-token-here
GITHUB_REPO=your-username/myfit-data
GITHUB_BRANCH=main
APP_PASSWORD=a-long-unique-passphrase-you-chose
```

Important facts about `APP_PASSWORD`:

- If it is empty or missing, the server refuses **every** sync request.
- It is one shared secret. There is no rate limiting or lockout, so a short password can be guessed. Make it long and unique.
- Never prefix any of these four names with `NEXT_PUBLIC_`.

Two optional **public** variables, `NEXT_PUBLIC_OPERATOR_NAME` and `NEXT_PUBLIC_OPERATOR_URL`, let you identify yourself as the operator of your own deployment in the footer. They are visible to every visitor.

## 9. Running the application locally

```
npm run dev
```

Open <http://localhost:3000> in your browser. After you change `.env.local`, stop the server (Ctrl+C) and start it again.

**Test cloud sync:**

1. In the app open *Settings*, then *Cloud Sync* (the *Sync and app password* row).
2. Type your `APP_PASSWORD` in the *App password* field. It is saved in this browser automatically.
3. Press *Sync now*.
4. You should see *Synced*. Open your data repo on GitHub: a `data/` folder with JSON files should appear.

Sync is **manual**. Nothing is uploaded until you press *Sync now*. Press it after you finish logging, and before you switch devices.

To check the production build locally: `npm run build` then `npm start`.

## 10. Pushing customized source code to GitHub

If you changed code or want your own copy online:

```
git status
git add .
git commit -m "Describe your change"
git push origin main
```

Before every commit run `git status` and confirm that **no** `.env.local`, backup, export or personal file is listed. If a secret was ever committed, treat it as exposed: revoke the token in GitHub right away and create a new one. Deleting the file in a later commit does not remove it from Git history.

For a **private copy** of the source (Option B in Chapter 4):

```
git remote rename origin upstream
git remote add origin https://github.com/YOUR-USERNAME/YOUR-PRIVATE-REPO.git
git push -u origin main
```

## 11. Importing the project into Vercel

1. Go to vercel.com and sign in with your GitHub account.
2. Choose *Add New*, then *Project*.
3. Under *Import Git Repository* select your source repository. If it is not listed, choose the option to adjust GitHub permissions and grant Vercel access to that repository only.
4. Vercel detects **Next.js** automatically. Leave the build settings at their defaults.
5. **Stop before deploying** and add the environment variables (next chapter).

## 12. Configuring environment variables in Vercel

On the import screen, open *Environment Variables* and add all four names and values from Chapter 8: `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BRANCH`, `APP_PASSWORD`.

- Do not add a `NEXT_PUBLIC_` prefix to any of them.
- Mark the secrets as sensitive if Vercel offers that option.
- To change a variable later, edit it under *Project, Settings, Environment Variables* and **redeploy**. Changes do not apply to an existing deployment.

## 13. Deploying and verifying the application

1. Choose *Deploy* and wait for the build to finish.
2. Open the URL Vercel gives you on your phone and computer.
3. Verify sync: *Settings, Cloud Sync*, enter the app password, press *Sync now*. Expect *Synced*.
4. Verify that the password is enforced: enter a wrong password and press *Sync now*. The app shows *Sync failed*, which means the server refused the request (it returned HTTP 401). Then re-enter the correct password.
5. Check your data repo on GitHub for new commits named `sync ...`.

On a phone you can add the site to your home screen from the browser menu for quick access.

Remember: **the URL is public.** The pages load for anyone who has the address; the password protects only the data route. Vercel offers additional deployment-protection options on some plans; check Vercel's current documentation and pricing.

## 14. Using the tracker

**Home.** Shows today's workout, the week strip, the 14-minute self-workout timer on gym days, pending exercises, daily protein and creatine Taken / Not taken check-ins, and the weekly check-in prompt.

**Workouts and the seven-day cycle.** The plan repeats every seven days: Day 1 Hybrid Push, Day 2 Hybrid Pull, Day 3 Quad-Focused Legs, Day 4 Rest, Day 5 Upper Body, Day 6 Glute and Hamstring-Focused Legs, Day 7 Rest, then Day 1 again. With the default settings Day 1 falls on a Monday, so the two rest days are Thursday and Sunday until you press Leave. To start a session, open *Workouts* and press *Start Workout*; log weight, reps and notes for each set and finish the workout. The app shows what you lifted last time.

**Leave.** If you cannot train today, press **Leave** on Home or Workouts and confirm. Today is marked **Skipped** (never Completed) and every later workout and rest day moves forward one day, keeping their order. Cancel changes nothing. Leave is not offered on rest days, on a day already skipped, or once a workout has been started.

**Editing the plan.** *Settings, Weekly Training Plan* lets you change which exercises are on each cycle day (tabs D1 to D7). *Settings, Manage Gym Equipment* lets you rename equipment and add exercises.

**14-minute self-workout timer.** On every gym day it is the first activity (Home and Workouts). Press Start, do your own warm-up, use Pause / Resume, and Stop (asks for confirmation). It keeps counting while you move between pages or minimise the browser and survives a refresh. It cannot run while the browser is closed or the device sleeps.

**Machine In Use, Pending and Repeat Set.** While logging, press **Machine In Use** to put the exercise in *Pending Exercises* and continue; press **Resume Exercise** later. Press **Repeat Set** to copy your last set's weight and reps into the next set form, then confirm with Complete Set.

**Sunday.** Sunday is always a rest day. A workout the rotation would have placed there moves to Monday.

**Water.** Use the quick-add buttons (250, 500 or 1000 ml) Set your daily water target under Goals and Targets.

**Body and progress.** Use *Settings, Weekly check-in*, *Weight log* and *Waist log* to record measurements, and *Progress* to see strength, weight, waist and water trends.

**Reports, exports and backups** (all under *Settings*):

- *Weekly summary*: review a week and press *Export weekly report* to download a Markdown file.
- *Export to Excel*: last 7 days, a custom range, or all history, as an `.xlsx` file.
- *Backup, Download JSON*: saves everything as `MyFit_Backup.json`.
- *Import Backup, Restore from JSON*: replaces **all** current data after a confirmation.
- *Reset All Data*: needs you to type RESET. If sync is on, the next sync overwrites the cloud copy as well, so download a backup first.

Exports and backups contain your personal records. Store them privately and never commit them.

## 15. Updating the app and pulling upstream changes

Your fork can receive improvements from the original project.

```
git remote add upstream https://github.com/greynoddigital/myfit-tracker.git
git fetch upstream
git merge upstream/main
npm ci
npm test
npm run build
git push origin main
```

If `git remote add upstream` says the remote exists, skip that line. Resolve any merge conflicts in your editor, then run the checks. Vercel redeploys automatically when you push. **Download a JSON backup before updating.**

## 16. Troubleshooting common errors

| Problem | What to check |
|---|---|
| *Sync failed* | The server could not complete the request. Check that the token is valid and not expired, that `GITHUB_REPO` is spelled `owner/name`, that the branch exists (the data repo needs at least one commit, so initialise it with a README), and that the token has *Contents: Read and write* on that repo. |
| *Sync failed* after you changed or retyped the password | The app shows the same *Sync failed* message for a wrong password. Check first that the password typed in *Settings, Cloud Sync* matches `APP_PASSWORD` exactly, and that `APP_PASSWORD` is set on the server (a missing value makes the server refuse everything). |
| *Remote has newer data* | Another device synced first. Sync from the device that has the newest data. Use *Keep my data and overwrite* only if you are sure your copy is the right one. |
| Changes to environment variables have no effect | Locally, restart `npm run dev`. On Vercel, redeploy. |
| `npm ci` fails | Install Node.js 20 or newer and try again. |
| Vercel build fails | Open the build log. Run `npm run build` locally to reproduce. |
| Data missing on a new phone or after clearing the browser | Data is stored per browser. On a new device enter the app password and press *Sync now* to pull your data, or use *Import Backup*. |
| Sync keeps failing although the token and password are right | Make sure the branch named in `GITHUB_BRANCH` really exists in the data repo (initialise the repo with a README). Also confirm the token has not expired. |

## 17. Security, privacy, backups and recovery

**What was verified in the source code:**

- The GitHub token is used only on the server (`lib/github.ts`, called by `app/api/data/route.ts`). No `NEXT_PUBLIC_` variable carries a secret.
- The data route requires the `x-app-password` header to equal `APP_PASSWORD`, otherwise it returns 401. It only reads and writes a fixed list of file names inside the one repository named by `GITHUB_REPO`.
- Stale writes are rejected so that newer cloud data is not silently overwritten.
- Import and export work in the browser and upload nothing by themselves.
- There is no analytics or tracking.

**Limits you must understand:**

- The site address is public; only the data route is password-protected.
- The password has no rate limiting. Use a long, unique one.
- The password you type is kept in your browser's local storage on that device, and local data is not encrypted. Do not use shared or public computers.
- Anyone with the password can read and overwrite all synced data.

**Backups and recovery:**

1. Download a JSON backup regularly (*Settings, Data Management, Backup*) and keep it somewhere private.
2. Your private data repo keeps the Git history of every sync, so earlier versions of each `data/*.json` file can be viewed on GitHub.
3. To restore, use *Import Backup* with a JSON file, or sync from a device that has good data.
4. If a token may be exposed: revoke it on GitHub (Settings, Developer settings, Fine-grained tokens), create a new one, and update `.env.local` and Vercel. If `APP_PASSWORD` may be exposed: choose a new one, update it in Vercel, redeploy, and re-enter it in the app.
5. Never share screenshots or exports containing private records.

## 18. Creator attribution, licence and contribution guidance

MyFit Tracker was designed and built by **Vishnu Prasad**. The canonical repository is <https://github.com/greynoddigital/myfit-tracker>.

- **Independent deployments.** You may run your own copy. Your deployment is yours: it is not necessarily owned, maintained or endorsed by the original author. You can show your name as operator in the footer with `NEXT_PUBLIC_OPERATOR_NAME` and `NEXT_PUBLIC_OPERATOR_URL`. See `docs/ATTRIBUTION_AND_FORKS.md`.
- **Keep attribution accurate.** Do not claim you created the original project, and keep the original credit and licence notice as the licence requires.
- **Licence.** At the time of writing no licence had been selected. Check the repository's `LICENSE` file. See `docs/LICENSE_RECOMMENDATION.md`.
- **Contributing.** Improvements are welcome upstream. Read `CONTRIBUTING.md`, run `npx tsc --noEmit`, `npm test` and `npm run build`, and never include secrets or personal data. Report security issues privately as described in `SECURITY.md`.

## 19. Thank you and official links

Thank you for using MyFit Tracker. Built for healthier habits. Shared with everyone.

Official links:

- Vishnu Prasad (personal website): <https://vxnuprasad.github.io/>
- GreyNod Labs (cybersecurity and security testing): <https://greynodlabs.com>
- GreyNod Digital (web development and digital services): <https://greynoddigital.github.io>
- Original MyFit Tracker repository: <https://github.com/greynoddigital/myfit-tracker>
