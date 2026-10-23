# ChoicePilot

ChoicePilot helps users organize a dilemma and identify information they need before deciding. The default flow assembles the reflection from the user's explicit entries in the browser and does not require a Gemini API key or call a hosted AI service.

## Run locally

**Prerequisite:** Node.js

1. Install dependencies: `npm install`
2. Start the development server: `npm run dev`

Start with one dilemma. The browser finds literal expressions in the text and asks up to three missing questions, one at a time. Users can skip questions, review the summary, and correct the situation, feelings, concern, or desired change before viewing a compact result.

This is a local rule based reflection tool, not a language model or psychological assessment. Quoted expressions can be incomplete or out of context, so user confirmation remains part of the flow. User statements are not presented as independently verified facts.

Choice conditions can be added in the optional input section. A seven-day plan is available on request, with task templates selected for learning, work, relationships, or general information gathering. Explicit time budgets and short response deadlines adjust the plan. The checklist and text/image copy features remain available.

## Checks

Run `npm run lint`, `npm run test:local`, and `npm run build`. Use `npm run preview` to preview the production build at `/ChoicePilot/`.

## Deploy to GitHub Pages

This repository is configured for the project site URL `https://minho-nim.github.io/ChoicePilot/`.

1. Push the project to a GitHub repository named `ChoicePilot`.
2. In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**.
3. Push to `main` or run the **Deploy ChoicePilot to GitHub Pages** workflow manually.

The deployed app uses the local reflection flow and does not need `GEMINI_API_KEY`.
