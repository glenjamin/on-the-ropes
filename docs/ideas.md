# Open threads and ideas

## Open

- A stricter bot mode as a difficulty score: no lookahead, picks the best-looking next move from what's on screen, every move wobbled, and reports the share of runs that reach the gong. The current bot overstates how easy a level is
- Ice (set 3) has had a first play-test; 3-1, 3-3 and 3-5 have changed since and are unplayed. Things to try: the grip times on ice and dark ice (`GRIP_SECS` in `src/sim.ts`), the ice-floor friction and glide (`ICE_FRICTION`, `ICE_GLIDE`), and the 3-5 launch (`RAMP_BOOST`, `LAUNCH_MAX_SPEED`)
- At launch speeds the camera trails the player by several hundred units, since it follows with a fixed lag; it may need to catch up faster during a launch
- The bot treats ice and dark ice like rock when picking targets and finds out by simulating; a person can see the colours, so it may undervalue or waste taps on them
- Only the piece the rope first caught decides the grip; a rope wrapped round an ice corner still holds as the first surface does

## Ideas for later sets

- A jungle set: swing from tree branches and leafy canopy clumps, with tree trunks drawn behind everything that you don't collide with (a background decoration layer in the level format, which could also add hills behind the lava or distant clouds). Green canopy palette with dappled light; falling ends in undergrowth or a river. Mechanic options: swaying vines that carry you with them, springy leaves that launch you, thorny branches the rope slides off, or branches that snap a second or two after you grab them. Start with one level for the look, then pick the mechanic
- Crumbling rocks that break a second or two after being grabbed
- Lava vents or bouncy pads for launches
- Hazard surfaces that kill on touch away from the lava
- Moving rocks that carry the rope anchor with them (the most work: moving collision and anchors)

## Polish not yet done

- King Tongue's "fast ball" look at high speed
- Sound, especially the gong
- A home-screen icon (iOS uses a page screenshot without one)
- Puffier cloud shapes; current clouds are boxes with cut corners
- The floating gong still swings on invisible cords when struck; it could drift and spin instead
- Torii gates or other decoration on start and goal platforms
