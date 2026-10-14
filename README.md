# MyFit Tracker

**Your fitness journey, one day at a time.**

MyFit Tracker is a mobile-first fitness tracking web application designed to help you manage workouts, track water intake, record supplements, and monitor fitness progress through a simple dashboard.

The application prioritizes local data storage, with optional manual synchronization to a private GitHub repository that you control.

## Features

### 🏋️ Workout Tracking
- Seven-day rotating workout schedule.
- Track exercises, sets, weights, and repetitions.
- View previous performance when logging a new set.
- Repeat Set to reuse the previous completed set's weight and reps.
- Mark an exercise as temporarily unavailable and resume it later through Pending Exercises.
- Leave a workout and shift the remaining schedule forward without losing or duplicating sessions.
- Sunday is always a rest day.

### ⏱️ Self-Workout Timer
- Choose a 5-minute or 10-minute countdown.
- Five minutes is selected by default.
- Start, pause, resume, and stop the timer.
- Countdown timing remains accurate when switching pages, minimizing the browser, or refreshing the page.
- Available on the Home dashboard on gym days.

The timer depends on the browser and device being available. It cannot actively run while the browser is fully closed or the device is asleep.

### 💧 Water Tracking
- Record daily water intake.
- Quickly add 250 ml, 500 ml, or 1 litre.
- View progress toward your daily hydration goal.
- Keep daily totals separate.

### 💊 Supplement Tracking
- Track protein and creatine intake.
- Mark supplements as Taken or Not taken.
- Record status independently for each day.

### 📈 Progress and Reports
- Weekly fitness check-ins for weight and waist measurements.
- Charts for strength, body measurements, and water intake.
- Export reports as Markdown.
- Export fitness history to Excel.
- Back up and restore data using JSON.

### 🔒 Data and Privacy
- Store fitness data locally in your browser by default.
- Use optional manual GitHub synchronization with your own private data repository.
- Keep cloud-sync credentials on the server rather than exposing them to the browser.
- Export and back up your data when needed.

**Important:** Browser-local data can be lost if browser storage is cleared. Keep regular backups. If you enable cloud synchronization, keep your data repository private.

## Technology Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Node.js
- GitHub API for optional cloud synchronization

## Getting Started

### Prerequisites

Install:
- Node.js 20 or newer
- npm
- Git

### Installation

Clone the repository:

```bash
git clone https://github.com/vxnuprasad/myfit-tracker.git
cd myfit-tracker
```

Install dependencies:

```bash
npm ci
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The application can be used locally without configuring cloud synchronization.

## Production Build

Create a production build:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Running Tests

Run the automated test suite:

```bash
npm test
```

The test suite covers workout scheduling, Sunday rest-day rules, workout deferrals, timer behavior, pending exercises, set repetition, supplement tracking, data handling, and exports.

## Optional GitHub Cloud Sync

Cloud synchronization is optional. You can use the app without setting it up.

To configure synchronization:

1. Create a separate **private GitHub repository** for your fitness data.
2. Generate a fine-grained GitHub Personal Access Token restricted to that repository, with the necessary Contents read/write permission.
3. Copy `.env.example` to `.env.local`.
4. Configure the environment variables below.
5. Restart the development server or redeploy the application.
6. Open the app's Settings and use Cloud Sync.

| Variable | Purpose |
|---|---|
| `GITHUB_TOKEN` | Secret token for accessing your private data repository |
| `GITHUB_REPO` | Repository in `owner/name` format |
| `GITHUB_BRANCH` | Data branch, usually `main` |
| `APP_PASSWORD` | Secret password required by the sync API |

Never commit `.env.local` or expose credentials through client-side environment variables such as `NEXT_PUBLIC_GITHUB_TOKEN`.

Synchronization is manual. Review the application's configuration and security documentation before deploying it publicly.

For more detailed setup and deployment instructions, see the documentation in the [`docs`](https://github.com/vxnuprasad/myfit-tracker/tree/main/docs) directory.

## Deployment

MyFit Tracker is a Next.js application and can be deployed to a compatible hosting provider, including Vercel.

For deployments using cloud synchronization, configure the required environment variables securely in the hosting provider's dashboard.

Review hosting limits, pricing, and security requirements before deployment.

## Project Structure

```text
myfit-tracker/
├── app/          # Next.js application and API routes
├── components/   # UI components
├── docs/         # Setup and project documentation
├── lib/          # Data, scheduling, timer and utility logic
├── tests/        # Automated tests
├── .env.example  # Environment variable template
├── package.json
└── README.md
```

## Contributing

Contributions, bug reports, and suggestions are welcome.

Before submitting a change:

1. Read [`CONTRIBUTING.md`](https://github.com/vxnuprasad/myfit-tracker/blob/main/CONTRIBUTING.md).
2. Keep changes focused and clearly described.
3. Run `npm test` and `npm run build`.
4. Never include personal fitness data, credentials, tokens, or private backups in a pull request.

Use GitHub Issues to report bugs or propose improvements.

## Security

This application may contain personal fitness and health-related information.

- Keep private fitness data repositories private.
- Use strong, unique secrets.
- Never commit credentials or personal data.
- Review [`SECURITY.md`](https://github.com/vxnuprasad/myfit-tracker/blob/main/SECURITY.md) before deploying the application.
- Do not treat an unlisted deployment URL as access control.

## Author

**Vishnu Prasad**

Developer and creator of MyFit Tracker.

- GitHub: [@vxnuprasad](https://github.com/vxnuprasad)

## License

No open-source license has been selected for this repository yet.

Until a license is added, do not assume that the code is available for unrestricted reuse, modification, or redistribution.

---

**Built to make consistent fitness tracking simpler.**
