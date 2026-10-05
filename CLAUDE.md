# On the Ropes

A mobile-first browser game that is only the ninja rope: swing from A to B over lava. The movement feel is modelled on King Tongue (iOS); see `docs/king-tongue.md`. We deliberately don't copy its combat.

## Design intent

- Movement values (gravity, rope stiffness and start length, reel speeds and easing, bounce, friction, time scale, zoom) were tuned by the user play-testing on an iPhone. Don't retune them as a side effect of other work; propose changes and let them try it
- Controls: tap fires the rope at the tapped point, tap again lets go, nothing else. The rope is a bungee that grabs already stretched and reels itself in
- Levels come in named sets of five (set 1 is "Lava"). Each set gets harder as it goes and the next introduces a new element. Levels should be about as long as 1-2, since shorter runs felt too easy
- Players swing almost constantly and rarely land, so put hazards and winds across the swing paths between anchors, not over ledges or landing spots
- How far apart anchors can be depends on the speed the player is expected to carry: letting go at speed flies them a ballistic arc before the next grab (up to roughly 400 extra at the speed cap), so gaps can exceed the rope's range (`HOOK_RANGE`) where speed is expected. Where the player starts from rest (level start, after a dead stop), the next anchor must be within range
- 1-2 is the original hand-tested run. Levels written by Claude are unplayed until the user play-tests them; say so when adding one

## Working in this repo

- The user tests on their phone through `npm run dev` on the LAN. Run the dev server outside the sandbox: inside it, Vite doesn't see file changes and keeps serving stale code
- `npm run snapshot`, `npm run e2e` and any Playwright or Chrome use must run outside the sandbox (Chrome can't create its profile sockets inside it). Git writes to `.git` and `gh` also need to run outside the sandbox
- `scripts/*.ts` run directly in Node with type stripping, so they can't import `src/` modules that use extensionless imports (e.g. the level list); that's why `snapshot.ts` reads level ids from file names
- Use `npm run snapshot -- overview` to review a level's layout, and the scenario page (`debug/scenario.html`) for a specific moment. The e2e checks read state through `window.game`, which only exists in dev builds
- After adding or changing a level, or retuning movement, run `npm run bot` to check every level is still beatable by human-like play; it found a level the rope-range cut had made impossible
- The physics tests and snapshot scenarios use coordinates in level 1-2, so changing its geometry can break them
- When adding a test for a fix, check it fails with the fix reverted; several tests here first passed for the wrong reason
- Pushes to `master` deploy to GitHub Pages (https://glenjamin.github.io/on-the-ropes/) via `.github/workflows/pages.yml`. Committing and pushing directly to master is fine on this project
