# EMBERFALL — Defend the Last Ember

A dark, atmospheric tower-defense game for make.fun's **best-game-01** bounty.
You defend the last ember against waves of shades that walk out of the dark.
Light is the ground you fight on: braziers burn the dark, and enemies in
darkness move faster. Survive all 12 waves to win.

## Play

Serve `game/` with any static server and open it in a desktop browser:

```sh
node serve.ts
# open http://localhost:8080
```

Or open `game/index.html` directly from the files (module scripts need a
server in some browsers; `serve.ts` is the easy way).

## How to play

- **Click a stone plot** to build the chosen brazier there.
- **1 / 2 / 3** choose the brazier: Spark (fast, cheap), Flame (heavy hits),
  Frost (slows shades in its glow).
- **U** upgrade the selected brazier, **X** sell it.
- **R** rekindle the ember (costs embers, restores health and light).
- **P** pause, **M** mute, **T** back to title.
- Shades that reach the ember bite it. If the ember dies, the dark wins.
- Clearing a wave pays embers. Survive all 12 waves for victory.

## Screenshots

Four real renders of the game's own code, taken deterministically from
`?shot=<scene>&seed=20261117` (see `shots.json`):

1. `1-title.jpg` — title screen
2. `2-play.jpg` — mid-wave play with HUD
3. `3-victory.jpg` — victory after 12 waves
4. `4-over.jpg` — game over

Regenerate them with `node shots.mjs` (needs `node serve.ts` running and
Playwright's Chromium), or playtest the whole loop with `node playtest.mjs`.

## Structure

- `game/index.html` — the page; loads the game as ES modules.
- `game/src/config.js` — all tuning: ember, braziers, enemies, waves, economy.
- `game/src/state.js` — the game state machine and run flow.
- `game/src/enemies.js` — shades: spawning, walking, light and dark.
- `game/src/towers.js` — braziers: build, upgrade, sell, firing.
- `game/src/waves.js` — the 12-wave schedule.
- `game/src/particles.js` — sparks, drifting embers, shake, floating text.
- `game/src/audio.js` — procedural WebAudio sound, no audio files.
- `game/src/render.js` — all drawing, including the darkness-and-light pass.
- `game/src/input.js` — mouse and keyboard.
- `game/src/shots.js` — deterministic screenshot scenes.
- `game/src/random.js` — seeded RNG for reproducible scenes.
- `game/src/main.js` — entry point; fixed-step simulation, rAF rendering.
- `main.ts` — the make.fun entry program: copies `game/` and `screenshots/`
  to `/output` and writes `dossier.json`.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.

## License

MIT. See `LICENSE`.
