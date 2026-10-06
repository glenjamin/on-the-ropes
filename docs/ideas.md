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
- Pinball (set 5) is unplayed. Things to try: how hard bumpers kick (`BUMPER_KICK`) and how fast a bumper or flipper can send you (`KICK_MAX_SPEED`), flipper timing and feel (`FLIP_UP_SECS`, `FLIP_HOLD_SECS`, `FLIP_DOWN_SECS`, `FLIPPER_REACH`, `FLIPPER_BOUNCE`), how long a launcher holds you (`LAUNCHER_HOLD_SECS`), all in `src/sim.ts`, and each launcher's own `speed` and `aim` in 5-3 and 5-5. The flipper gap in 5-2 and the launchers in 5-3 and 5-5 were checked by removing them and seeing the bot fail, so retuning bats or launches means re-checking them
- A flipper only gains about as much height as a good swing does, wherever it is, so it can bat you across a gap but not up to somewhere out of reach; 5-5 climbs with a launcher instead
- Flippers aren't grabbable and the rope passes through them; a launcher's cup is ordinary terrain the rope can catch on, and is shallow, so it can only fire upwards of about 30° above level without clipping its rim
- Like ice, the bot treats bumpers as rock when picking targets and finds out about the kick by simulating
- Factory (set 6) is unplayed. Things to try: how fast the presses and shuttles move (each platform's `travel` and `period` in 6-1 to 6-5), how hard a belt grabs your feet (`BELT_GRIP`), how deep a press can squeeze you before it crushes (`CRUSH_DEPTH`), how thick a wire is to touch (`WIRE_RADIUS`), all in `src/sim.ts`, and each conveyor's `speed` and crate count. Crate size is `CRATE_INNER`, `CRATE_DEPTH` and `CRATE_WALL` in `src/level.ts`
- Moving platforms are grabbable and carry the rope's hook with them, but the rope doesn't wrap round their corners, and they pass through terrain; levels keep them in open air
- The hook glances off crates rather than catching, so that the crate lift in 6-4 has to be ridden; otherwise the rope could climb the column of crates like a ladder
- Wires are deadly only to the player: the rope passes through them, insulated. A pulsing wire spits sparks for a moment before it goes live
- A platform only crushes you when it squeezes you against something else; one sweeping through a swing knocks you aside, carrying its speed into the bounce
- Space (set 7) is unplayed. Each level sets its own lower gravity (`gravity` in 7-1 to 7-5, falling from 1500 to 900 against the usual 2000). Things to try: how fast a caught planet spins and how quickly it gets there (`PLANET_SPIN`, `PLANET_SPIN_UP_SECS`), how hard it pushes you round to keep up (`PLANET_WHIRL`), how long it keeps spinning after you let go (`PLANET_SPIN_DECAY`), how close it reels you in (`PLANET_ROPE_MIN`), the planet rope's feel (`PLANET_ROPE_STIFFNESS`, `PLANET_ROPE_DAMPING`, `PLANET_START_LENGTH`), how fast a fling can go (`PLANET_MAX_SPEED`) and how hard black holes pull (`BLACK_HOLE_PULL`), all in `src/sim.ts`
- Planets spin a fixed way each, shown by arrows round them, so one spinning against your swing yanks you backwards; catch it from the other side. A rope caught on a planet wraps round its surface when you fall behind it, but doesn't wrap round other terrain corners from there. Planets have no gravity of their own, so the black holes are the only thing that bends a flight
- You orbit a planet about a radius out from its surface, so a bigger planet whirls you faster and flings you further. The planet-only gaps (in 7-2, and across the black holes in 7-3, 7-4 and 7-5) were checked by turning every planet to rock and seeing the bot fail; lower gravity carries a rock swing further, so those gaps widen through the set, and retuning the planets means re-checking them
- After letting go the bot waits at most 0.6s before tapping again, so on a long planet fling it often re-grabs the planet until a release lines up; its grab counts on 7-2 overstate how fiddly the level is
- Black holes pull on the player but not on the hook, which flies straight and is lost if it flies into one; they stop pulling once the gong is struck
- The bot treats coming near a black hole like skimming the death line, and taps round each planet's surface; it knows each planet's spin direction only by simulating

## Ideas for later sets

- Other jungle mechanics we didn't build: springy leaves that launch you, thorny branches the rope slides off. Trunks are a background layer in the level format that other sets could use for hills behind the lava or distant clouds
- Crumbling rocks that break a second or two after being grabbed
- Lava vents or bouncy pads for launches; the pinball launcher's cup could be reskinned as either

## Polish not yet done

- King Tongue's "fast ball" look at high speed
- Sound, especially the gong
- A home-screen icon (iOS uses a page screenshot without one)
- Puffier cloud shapes; current clouds are boxes with cut corners
- The floating gong still swings on invisible cords when struck; it could drift and spin instead
- Torii gates or other decoration on start and goal platforms
