# Jolly Ice creams

Landing page for Jolly Ice creams, now in Bangalore and Salem.
Live site: https://khan-0910.github.io/Jolly-Icecream/

Built with React, Vite, GSAP, Lenis and React Bits. All art is hand-drawn SVG.

## Run it

```bash
cd jolly
npm install
npm run dev
```

Pushing to `main` rebuilds and redeploys the site through GitHub Actions.

## Optional generated images

`jolly/scripts/generate-assets.mjs` can make photo cones through Gemini or kie.ai.
Keys go in `jolly/.env.local` (never committed). Point `jolly/src/config.js` at the results.
