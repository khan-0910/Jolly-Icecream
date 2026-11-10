# Higgsfield asset prompts for Jolly Ice creams

Run these once the Higgsfield workspace has credits (about 94 credits for the full set),
save the results into `public/assets/`, and point to them in `src/config.js`.
Anything left as `null` in the config falls back to the hand-drawn SVG cones.

## Hero video (Seedance 2.5, 16:9, 5s, 1080p, audio off, ~80 credits)

> Macro slow-motion shot of a single scoop of strawberry ice cream in a waffle cone, slowly
> softening and melting, one glossy pink drip running down the side of the cone. Soft studio
> light, shallow depth of field, dreamy pastel mint-green backdrop. Locked-off camera with a
> very slight push-in. Seamless loop, no text, no hands.

Save as `public/assets/hero.mp4` and set `heroVideo: '/assets/hero.mp4'`.

## Flavour cones (GPT Image 2.6, 4:5, quality high, 2k, background transparent, ~2.75 each)

Shared style line, add to the end of every prompt:
> Studio product photo, single cone floating, centred, three-quarter view from slightly
> above, soft diffused light, gentle contact shadow, transparent background, no text,
> no props, no hands.

1. **Vanilla**: one generous scoop of vanilla bean ice cream, creamy ivory with visible
   black vanilla specks, a soft melt starting at the rim of a golden waffle cone.
2. **Cookies & cream**: one scoop of white cookies and cream ice cream packed with chunks
   and crumbs of dark chocolate sandwich cookie, in a golden waffle cone.
3. **Strawberry**: one scoop of pastel pink strawberry ice cream with small pieces of real
   strawberry and a ripple of strawberry sauce, in a golden waffle cone.
4. **Irish**: one scoop of latte-coloured Irish cream ice cream with a glossy caramel-coffee
   ribbon swirled through it, in a golden waffle cone.
5. **Guava**: one scoop of coral-pink guava ice cream dusted with fine red chilli powder,
   topped with a thin slice of pink guava with its green skin, in a golden waffle cone.

Save as `public/assets/flavors/<id>.png` (ids: vanilla, cookies, strawberry, irish, guava)
and set each entry under `flavors` in `src/config.js`.
