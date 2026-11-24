# Jolly Ice creams

Landing page for Jolly Ice creams, now in Bangalore and Salem.
Live site: https://khan-0910.github.io/Jolly-Icecream/

Built with React, Vite, Three.js, GSAP and Lenis. Every cone, scoop and ingredient is modelled in code (`jolly/src/three`).

## Run it

```bash
cd jolly
npm install
npm run dev
```

Pushing to `main` rebuilds and redeploys the site through GitHub Actions.

## Optional generated images

`jolly/scripts/generate-assets.mjs` can make photo cones through Gemini or kie.ai.
The current design does not use them. Keys go in `jolly/.env.local` (never committed).
