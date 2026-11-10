---
name: kie-media
description: Generate images and videos for the Jolly site through kie.ai (the backend Open-Higgsfield-AI uses) or Gemini, with the user's own API key, and save the files into the project. Use when the user asks for generated visuals without the Higgsfield connector.
---

# Media generation for Jolly

## Keys

- Keys live in `jolly/.env.local` (`GEMINI_API_KEY=...`, `KIE_API_KEY=...`). The user adds them themselves.
- Never ask for a key in chat, never print, log or commit it. `.env.local` is gitignored.

## Commands (run from `jolly/`)

- `node scripts/generate-assets.mjs --dry` prints the requests and spends nothing.
- `node scripts/generate-assets.mjs` uses kie.ai: five cones (`nano-banana-pro`) plus the hero video (`bytedance/seedance-2`). Paid per generation.
- `node scripts/generate-assets.mjs --provider=gemini` makes the five cones with `gemini-2.5-flash-image`.
  Note: as of Nov 2026 the user's free Gemini tier had an image quota of 0, so this needs billing.
- `--only=vanilla,hero` reruns some of them.

## kie.ai API

`POST https://api.kie.ai/api/v1/jobs/createTask` with `{ model, input }`, then poll
`GET /api/v1/jobs/recordInfo?taskId=...` until `state` is `success`, and read `resultJson.resultUrls`.

## After generating

1. Look at every file before using it.
2. Point `jolly/src/config.js` at the files (`heroVideo`, `flavors.<id>`). The SVG cones stay as the fallback.
