# DGI/DIL English Trainer

React + Vite + TypeScript training app for a Japanese valuation advisor preparing for English Q&A with the UK Tax Director of DIL, DGI's UK subsidiary.

The app runs fully in the browser. It has no backend, no authentication, no database, and no external paid API calls.

## Features

- 30 DGI/DIL valuation and tax-simulation Q&A items
- Sequential, random, and weak-question review modes
- Category and difficulty filters
- Browser audio playback with MP3-first, SpeechSynthesis fallback
- en-GB voice preference with English fallback
- Voice, rate, pitch, volume, repeat count, and listening-mode settings
- Japanese listening summary, English answer, and notes fields
- Four self-score metrics: Listening, Response speed, Practical safety, Naturalness
- localStorage progress persistence
- Dashboard with daily and metric-specific SVG charts
- Weak-question prioritisation
- CSV export for score records and question-level summaries
- Reset controls for progress, audio settings, and current answer drafts

## Setup

```powershell
npm install
npm run dev
```

Vite will print a local URL. With the current GitHub Pages base setting, the app is available locally at:

```text
http://localhost:5173/dgi-dil-english-trainer/
```

## Build

```powershell
npm run build
npm run preview
```

`npm run build` runs TypeScript first and then creates static files in `dist/`.

## GitHub Pages

The app is configured for repository-subpath hosting:

```ts
// vite.config.ts
base: '/dgi-dil-english-trainer/'
```

Deploy with:

```powershell
npm run deploy
```

Before deploying, update `package.json`:

```json
"homepage": "https://USERNAME.github.io/dgi-dil-english-trainer/"
```

Replace `USERNAME` with your GitHub user or organisation name. The `deploy` script builds the app and publishes `dist/` using `gh-pages`.

## MP3 Audio Files

Place pre-generated MP3 files here:

```text
public/audio/
```

Use these filenames:

```text
q01.mp3
q02.mp3
...
q30.mp3
```

Each question already references `/audio/q01.mp3` through `/audio/q30.mp3`. If a file is missing or cannot be played, the app falls back to browser SpeechSynthesis.

## Progress Storage

All user progress is stored in browser `localStorage` under keys prefixed with:

```text
dgi-dil-english-trainer:
```

Stored data includes score records, draft answers, reviewed-question marks, and audio settings. Data remains on the same browser/device until the user resets it or clears site data.

## CSV Export

Use the Dashboard or Settings screen to export:

- `dgi-dil-score-records.csv`
- `dgi-dil-question-summary.csv`

Score CSV fields include timestamp, question id, category, difficulty, Japanese summary, English answer, all four metric scores, total score, and notes.

## Future Extension Points

The code keeps audio, storage, scoring, and CSV logic isolated in `src/utils/`, so later versions can add AI feedback, CEFR assessment, generated TTS audio, speech-to-text transcription, or a Cloudflare Workers/Vercel Functions backend without rewriting the training UI.
