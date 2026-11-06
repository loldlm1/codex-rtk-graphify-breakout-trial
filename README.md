# Canvas Breakout workflow trial

This public, reusable repository tests a Codex workflow coordinated by Matt Pocock's
skills, with ECC as its sole TDD provider. The comparison uses the validated updated
hybrid without experimental activation and the same hybrid with RTK command filtering
and Graphify Labs' free local MCP.

The maintainer defines and approves scope. Codex agents prepare, implement, test and
review the fixtures. Native account sign-in and hook approvals remain human actions;
agent-built does not mean those approvals were automated.

The planned measured task is pause/resume and reliable restart for a modular Canvas Breakout game.
The application starter will be preserved on a dedicated branch and immutable tag.
Measured solution branches and PRs remain separate and will not be merged into it.
Shared measurement code lives on the task-board repository's `protocol/v1` branch,
separate from the application starter trees.

The initial pilot has exactly four implementations across the two repositories.
Adoption requires at least 10% fewer allocated complete-run tokens on **each**
workload and no meaningful output-quality regression. A pooled average cannot
rescue a failing workload. No outcome or savings is claimed during preparation.

Accepted common stack profile: `51ed50320fff77610a9030e0846fbe6f532c39ba6c766466ffb0f1026b4d2f97`.
Source, prompts/configuration, acceptance, checks, aggregate usage, application
artifacts and limitations will be versioned. Private sessions, credentials, native
trust/configuration and generated caches will remain private. Routine future upgrades
start with proportional compatibility/recovery checks; full comparisons need a
material reason, and tasks rotate when contamination or relevance requires it.

Current phase: playable starter prepared; independent review/publication and
measured evidence pending.
No measured solution, release or deployment is present.

## Play Breakwater

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
supported source files; HTML and inline JavaScript are outside that Graphify
coverage boundary. Keep this boundary consistent across implementations; runtime,
browser and visual checks remain necessary. Shared comparison machinery stays in
the separate method branch described above.
