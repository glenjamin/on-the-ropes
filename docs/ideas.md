# Open threads and ideas

## Open

- A stricter bot mode as a difficulty score: no lookahead, picks the best-looking next move from what's on screen, every move wobbled, and reports the share of runs that reach the gong. The current bot overstates how easy a level is
- Ice (set 3) has had a first play-test; 3-1, 3-3 and 3-5 have changed since and are unplayed. Things to try: the grip times on ice and dark ice (`GRIP_SECS` in `src/sim.ts`), the ice-floor friction and glide (`ICE_FRICTION`, `ICE_GLIDE`), and the 3-5 launch (`RAMP_BOOST`, `LAUNCH_MAX_SPEED`)
- At launch speeds the camera trails the player by several hundred units, since it follows with a fixed lag; it may need to catch up faster during a launch
- The bot treats ice and dark ice like rock when picking targets and finds out by simulating; a person can see the colours, so it may undervalue or waste taps on them
- Only the piece the rope first caught decides the grip; a rope wrapped round an ice corner still holds as the first surface does
- Jungle (set 4) is unplayed apart from an early look at the vines, which were calmed down after feeling too springy. Things to try: how heavy a vine swing feels (`VINE_MASS`, `VINE_DAMPING`, `VINE_ROPE_STIFFNESS`, `VINE_ROPE_DAMPING`, `VINE_START_LENGTH` in `src/sim.ts`), how hard a green vine flings you (`VINE_PUMP`, `VINE_MAX_SPEED`), and how long a brown vine holds (`VINE_SNAP_SECS`). The green-only gaps (4-1, 4-2, both in 4-5) were checked by turning that vine brown and seeing the bot fail, so retuning the green fling means re-checking them
- A rope caught on a vine keeps its wraps round terrain corners, but only the segment to the player wraps; a vine swinging its first segment through terrain doesn't bend it. Levels keep vines in open air so it doesn't show
- The bot sees vines and aims where they hang at that moment, but like ice it can't tell green from brown except by simulating

## Ideas for later sets

- Other jungle mechanics we didn't build: springy leaves that launch you, thorny branches the rope slides off. Trunks are a background layer in the level format that other sets could use for hills behind the lava or distant clouds
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
