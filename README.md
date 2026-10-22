# ChoicePilot

ChoicePilot helps users organize a dilemma and identify information they need before deciding. The default flow assembles the reflection from the user's explicit entries in the browser and does not require a Gemini API key or call a hosted AI service.

## Run locally

**Prerequisite:** Node.js

1. Install dependencies: `npm install`
2. Start the development server: `npm run dev`

Users enter their situation, feelings, main concern, and desired change directly. Choice comparison is optional. The app keeps its result, seven-day plan, completion checklist, and copy/export features.

## Deploy to GitHub Pages

This repository is configured for the project site URL `https://minho-nim.github.io/ChoicePilot/`.

1. Push the project to a GitHub repository named `ChoicePilot`.
2. In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**.
3. Push to `main` or run the **Deploy ChoicePilot to GitHub Pages** workflow manually.

The deployed app uses the local reflection flow and does not need `GEMINI_API_KEY`.
