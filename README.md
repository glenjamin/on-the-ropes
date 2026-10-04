# On the Ropes

A browser game that's just the ninja rope from Worms: swing across a lava cave to the flag, as fast as you can. Built for phones first.

## Playing

`npm run dev` serves it on your LAN — open the Network URL on your phone. It plays in landscape only; held upright, the game pauses behind a rotate prompt. On Android the first tap goes fullscreen and locks landscape. On iPhone, Safari can't go fullscreen, so use Share → Add to Home Screen and launch it from there.

- Tap to fire the rope at the point you tapped. It stays attached when you lift your finger
- The rope is a bungee: it grabs already stretched, so it yanks you towards where it caught, then keeps reeling itself in. Swing and fling yourself with it
- Tap again to let go
- Desktop: the mouse works the same; R restarts

## Code

- `src/sim.ts` — player, hook and bungee-rope physics, including the rope bending round corners and unbending when swung back
- `src/levels/` — one file per level (`1-2.ts` is set 1, level 2), listed in play order in `index.ts`. Sets are named in `index.ts` (set 1 is the lava levels); each gets harder as it goes, and the next set introduces something new
- `src/level.ts` — the level data format, and turning it into collision geometry; corners the rope can bend round are derived from the polygons
- `src/render.ts` — Canvas 2D drawing
- `src/main.ts` — game loop, input, camera and HUD

## Checking changes

- `npm test` runs the physics checks: how the bungee stretches, pulls and reels; bounces off walls, floors and ceilings; the speed limit; and hundreds of randomised fire/reel/release attempts asserting the player and rope never pass through terrain, the rope never lengthens while reeling, and it bends and unbends round corners
- `npm run snapshot` renders scripted game states (`debug/scenario.html`) at two landscape phone sizes and saves screenshots to `snapshots/`, printing a summary of each state. It drives your installed Chrome via Playwright. Pass a filter to run a subset, e.g. `npm run snapshot -- bend`
- `npm run e2e` plays the real game page with mouse input in Chrome and checks the controls: tap aim, the rope staying attached and reeling itself in with its easing, tap to let go, level unlocking and progression, and the portrait rotate prompt. It reads game state through `window.game`, which only exists in dev builds
- `npm run snapshot -- overview` renders each level whole, for reviewing a level's layout at a glance
- `debug/scenario.html` also works directly in the dev server for poking at a state by hand, e.g. `/debug/scenario.html?ang=-0.9&reel=-120&secs=8&until=bend`
