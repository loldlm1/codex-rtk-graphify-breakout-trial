# Pause, resume and reliable restart v1 — frozen future task

This task is unimplemented in starter v1. Starter preparation does not authorize
implementing it. Each independent implementation receives this exact prompt,
acceptance suite, commands and rubric from the same frozen starter.

## Exact implementation prompt

> Implement pause/resume and reliable restart for Breakwater. Add native buttons
> named “Pause” (changing to “Resume” while paused) and “Restart”, with readable
> state feedback and visible keyboard focus. Pause must freeze the entire
> simulation; resume must continue the same round without advancing through
> paused time. Restart must immediately begin a fresh round from playing, paused,
> won or lost, resetting score, lives, every brick, ball, paddle and held input.
> Repeated restart, pause and resume must never create duplicate animation loops.
> Preserve existing gameplay, keyboard and pointer/touch steering, HUD, Canvas
> rendering and responsive visual quality. Keep the ordinary TypeScript modules
> and current stack. Provide controller pause(), resume() and restart() commands
> through the public state/timing boundary described below. Run the starter
> checks and the separate future acceptance suite. Use ecc:tdd-workflow as the
> sole implementation/test cycle, explicitly replacing delegated Matt tdd. Do
> not also run Matt TDD or nest ECC orchestration workflows. Report actual
> RED/GREEN, commands, coverage and gaps; do not weaken frozen checks.

## Fixed behavior and public seams

- Keep `createGameState()` as the fresh-round reference and retain its initial
  values: playing, score 0, three lives, forty live bricks, centered paddle and
  the initial ball position/velocity. `restart()` resets the supplied public
  state model in place and paints it immediately, including from terminal rounds.
- `GameController` retains its state, control source, paint callback and frame
  scheduler constructor seam. Add `pause()`, `resume()` and `restart()` methods.
  State gains `paused`; existing `playing`, `won` and `lost` states remain.
  These are ordinary game commands, with no production test globals or debug UI.
- Pause preserves ball position/velocity, paddle, brick membership, score and
  lives across arbitrary elapsed wall time and new movement input. It clears
  held input. Pausing twice is safe. Pausing a won/lost round does not revive it.
- Resume preserves the round, clears the timing baseline and bounds its first
  simulation step to at most 50 ms. After that, normal elapsed-time motion
  continues. Resuming twice is safe; resuming a terminal round does not revive it.
- Restart clears both held keyboard directions and pointer target, clears stale
  timing, restores the complete fresh-round model and ensures one live scheduled
  animation chain. The first frame after restart advances at most 50 ms and a
  subsequent 20 ms frame advances normally. Thirty repeated restarts, including
  transitions through pause and a terminal state, still produce one paint per
  delivered frame. Disposal cancels the remaining frame and clears input.
- Native `Pause`/`Resume` and `Restart` buttons work with keyboard focus and Enter,
  keep focus on a relevant visible control and have visible focus treatment.
  `Round status` announces pause and terminal state. Pause changes to Resume;
  restart returns the button to Pause and the round to playing. Terminal feedback
  must explain Restart. No new keyboard shortcut is required.
- At 390×844, buttons remain reachable, readable and at least 44×44 CSS pixels;
  the page has no horizontal overflow. Preserve 1280×1000 desktop clarity and
  the current keyboard/pointer/touch gameplay. New artwork or redesign is not
  required. New levels, storage, accounts, frameworks, services and unrelated
  gameplay changes are outside scope.

## Acceptance and commands

With Node 24 and Google Chrome available:

```sh
npm ci
npm run verify
npm run test:feature
```

`verify` is the normal starter gate: typecheck, production build, all-source unit
coverage and actual Chrome browser journeys. `test:feature` is separate and
intentionally RED in the starter. It runs the frozen controller acceptance and
then the frozen browser acceptance. Either suite can also be diagnosed directly:

```sh
npx --no-install vitest run --config vitest.feature.config.ts
npx --no-install playwright test --config playwright.feature.config.ts
```

The fixed tests live in
[controller acceptance](../../tests/feature/unit/pause-restart.test.ts) and
[browser acceptance](../../tests/feature/browser/pause-restart.spec.ts).
They observe the supplied public game model, an injected scheduler/control source,
actual Canvas pixels, visible HUD and native browser interaction. They do not
inspect private controller fields or expose an application test mode. The model
seam makes win/loss reset deterministic; browser journeys independently exercise
pause rendering, ordinary play, repeated restart and terminal recovery.

All starter tests remain required, including scoring, brick/wall/paddle collisions,
life loss, terminal states, keyboard and touch steering. Coverage includes every
application TypeScript file and must meet 80% statements, branches, functions and
lines without artificial exclusions. Add focused tests for new boundary behavior;
passing the frozen checks alone does not excuse a concrete defect. In particular,
independent review also checks focus retention and clear terminal instructions.

## Fixed review rubric

Required gates: all starter and future checks pass, no duplicate loops, complete
state/input reset, safe resume timing, no uncaught interaction errors and measured
coverage meeting the floor. Missing required evidence blocks acceptance. Review
both sizes above with keyboard and pointer/touch, saving desktop/mobile screenshots
and actual results. Compare with the starter and apply the same rubric to each
independent implementation. Record each axis independently; no average rescues a
material output-quality regression.

| Axis | 2 — meets scope | 1 — minor issue | 0 — material failure |
| --- | --- | --- | --- |
| Correctness and scope | All pause/resume/reset/timing gates pass; changes stay in scope | Minor feedback wording issue with correct behavior | Missing behavior, stale input/state, duplicate loops, timing jump or failed required check |
| Maintainability | Small changes follow existing modules and stack; meaningful public-boundary tests | Local naming or duplication issue | Speculative machinery, tangled lifecycle/state, test-only production coupling or weakened checks |
| Visual clarity | Paused/playing/terminal state, HUD and buttons are clear at both sizes; Canvas quality preserved | Small spacing or typography issue without ambiguity | Ambiguous state, unreadable or clipped content, hidden controls or layout breakage |
| Interaction | Keyboard focus, Enter, pointer/touch, button labels and 44×44 mobile targets work predictably | Small extra navigation cost without blocking use | Lost focus, keyboard trap, unreachable action, stuck input or unusable touch controls |
| Gameplay and regressions | Existing collisions, scoring, lives, win/loss, steering and stable motion remain intact | Small nonblocking presentation inconsistency | Broken gameplay, terminal recovery, rendering, input or existing acceptance |

Any score of 0 or failed required gate is a material regression. Scores below 2
need concrete observations. The wider comparison protocol owns token allocation,
independent review and the final paired decision; this contract claims no measured
result or savings.
