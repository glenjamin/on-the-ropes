# On the Ropes

A browser game that's just the ninja rope from Worms: swing across a lava cave to the flag, as fast as you can. Built for phones first.

## Playing

`npm run dev` serves it on your LAN — open the Network URL on your phone (landscape plays best).

- Press and hold where you want the rope to grab; release to let go
- While holding, drag up/down to reel in/out and left/right to swing harder
- Desktop: mouse to fire, W/S to reel, A/D to swing, R to restart

## Code

- `src/sim.ts` — player, hook and rope physics, including the rope bending round corners and unbending when swung back
- `src/level.ts` — level geometry; corners the rope can bend round are derived from the polygons
- `src/render.ts` — Canvas 2D drawing
- `src/main.ts` — game loop, input, camera and HUD

## Checking changes

- `npm test` runs the physics checks: hanging from the rope, and hundreds of randomised fire/swing/release attempts asserting the player and rope never pass through terrain and that the rope bends and unbends
- `npm run snapshot` renders scripted game states (`debug/scenario.html`) at landscape and portrait phone sizes and saves screenshots to `snapshots/`, printing a summary of each state. It drives your installed Chrome via Playwright. Pass a filter to run a subset, e.g. `npm run snapshot -- bend`
- `debug/scenario.html` also works directly in the dev server for poking at a state by hand, e.g. `/debug/scenario.html?ang=-1&pump=1&secs=4&until=bend`
