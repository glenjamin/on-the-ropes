# King Tongue movement reference

Findings from a frame-by-frame analysis of a King Tongue walkthrough video (tutorial and level 1-2 traversal, tracked against static scenery). Lengths were measured in the monkey's body diameter (D) and converted at 1 D = 24 of our units. Figures are real-time; our sim runs at 0.8×, so divide speeds by 0.8 and accelerations by 0.64 for game-time values. Expect ±10% error throughout.

## How it works

- **Firing:** the tongue fires straight toward the tap point and continues past it until it hits terrain, at about 4,100–4,800 u/s. It attaches exactly where it hits; there's no auto-aim. Range is roughly one screen width (about 1,000 u). On a miss it extends to full range and vanishes within a frame.
- **Attached:** a spring toward the anchor with roughly zero rest length, never slack. It pulls the monkey through and past the anchor like a slingshot, with very light damping. There's no separate reel-in mechanic.
- **Gravity:** about 130 u/s² real (about 210 game-time), so roughly a tenth of ours at 2000. That's why its flights are long and floaty.
- **Release:** keeps the current velocity, with no boost. The core loop is to grab, get yanked, release near the anchor, and fly.
- **Collisions:** restitution is about 0.4 off walls and about 0.25 off ceilings. Floors are near-frictionless rolling.
- **No air drag, no air control, and no speed cap seen** up to about 800 u/s real.
- **Corner wrapping:** not observed; the tongue is always one straight segment.
- **Camera:** follows with about 0.3 s lag and no lookahead. It zooms out about 13% at high speed and clamps to the arena bounds.
- **Visuals:**
  - a thin white-to-cyan trail lasting 1.5–2 s, showing the whole last arc;
  - an expanding ring at the tap point;
  - a glowing "fast ball" look above about 600 u/s real;
  - no screen shake on terrain hits.

## Where we differ, on purpose

- Our rope is a bungee rather than a pure zero-length spring. It grabs at 30% of the grab distance and auto-reels with an ease-out, which keeps swinging arcs and corner wrapping.
- Gravity is much higher (2000 game-time), as preferred in play-testing; the spring stiffness is set to suit it.
- We keep a camera lookahead and frame the player below centre, so the ceiling stays in view.
- Not yet adopted: the "fast ball" look.
