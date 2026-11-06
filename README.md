# Breakwater

Breakwater is a small Canvas Breakout game: steer with ←/→, A/D, your pointer or
a touch drag; clear forty bricks before losing three lives. Paddle contact changes
the shot angle. The starter starts playing immediately. Refresh after a terminal
round to play again. Pause/resume and in-page restart are the **unimplemented**
[future task](docs/tasks/pause-resume-restart-v1.md).

Use Node 24 (validated with 24.6.0), npm 11.5.1 and Google Chrome:

```sh
npm ci
npm run dev
```

Vite prints the local address. The standard check is `npm run verify` (typecheck,
build, all-source coverage and actual Chrome desktop/mobile journeys). The separate
`npm run test:feature` intentionally fails on this starter because the future
controls and controller commands do not exist. It becomes required when that task
is implemented. See [starter validation](docs/validation/starter-v1.md) for actual
TDD evidence, environment and limitations.

The ordinary source modules cover game state, physics, controls, frame lifecycle,
Canvas/HUD presentation and bootstrap. A public state model plus injected frame
scheduler/control source support deterministic gameplay checks without debug UI
or production test globals. There are no network services or saved player data.

The entry point is external TypeScript loaded by HTML. Code-only analysis covers
supported source files; HTML and inline JavaScript are outside that source-coverage
boundary. Keep this boundary and the source architecture consistent across
independent implementations; runtime, browser and visual checks remain necessary.

Public purpose, method and preparation provenance are documented on the
[repository’s main branch](https://github.com/loldlm1/codex-rtk-graphify-breakout-trial/tree/main).
