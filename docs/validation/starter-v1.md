# Breakwater starter validation

Scope comes from [the starter contract](../tasks/starter-v1.md), the maintainer's
approved parent specification and task 19. The maintainer defines scope and native
approvals; Codex implements and tests the fixture using ECC TDD under the Matt
coordinator. Preparation precedes the measured task and is outside its four runs.
Independent final review and publication belong to the coordinator.

## Implementation and TDD

Journeys: steer the paddle with keyboard or pointer/touch; bounce the ball, clear
bricks and score; lose lives and reach terminal feedback; keep timing stable at
normal frame rates and bound long background gaps. The starter autoplays. Refresh
starts a new page/round; there is no pause/resume command or reliable in-page reset.

| Behavior | Test boundary | Actual RED | GREEN guarantee |
| --- | --- | --- | --- |
| State, physics, animation and controls | `npm test` | Three test modules failed to resolve the absent application modules before implementation; compile/transform RED for missing implementation, not dependency setup | Independent state, elapsed-time steering, collisions, scoring, lives, win/loss, bounded frame gaps and input release |
| Readable view and entry point | `npm test -- tests/unit/view.test.ts` | Absent render module before implementation | Score/lives/bricks/terminal text, Canvas error and external bootstrap/disposal |
| Controller input lifecycle | `npm test -- tests/unit/controller.test.ts` | Two runtime failures because controller did not accept the public control source yet (`this.controls is not a function`) | Public source supplies input and clears held controls on disposal |
| Browser gameplay and presentation | `npm run test:browser` | Initial checks exposed selector ambiguity and one-frame sampling tolerance in the test; these were test-harness corrections, not claimed behavior RED | Native Canvas pixels show keyboard and touch paddle movement; score changes; game over and refresh work; mobile fits |

The core suite first passed 13 tests. The view suite had an additional setup error
from a browser-transformed `import.meta.url`; reading the fixture relative to the
runner directory corrected it. That setup failure is not TDD evidence. After
presentation, all 16 unit tests and all three Chrome browser journeys passed.
The green refactor extracted the injected-frame helper for reuse by the separate
future suite. No RED/GREEN checkpoint commits or tests asserting prose were added.

## Actual environment and validation

Common validated versions: Node 24.6.0, npm 11.5.1 and Google Chrome
155.0.8059.39 on Linux. Exact dependencies are locked in `package-lock.json`:
Vite 8.3.6, TypeScript 7.0.2, Vitest/coverage-v8 5.1.0, jsdom 29.1.1,
Playwright 1.65.0 and Node types 24.19.2. `npm install` completed with zero audit
vulnerabilities. Package-manager detection selected npm; package metadata now pins
npm. No extra application framework, lint tool or CI was needed.

The final actual results and independent-review pointer are recorded by the
coordinator in [the execution record](../work/starter-v1.md). Screenshots/raw logs
stay outside the application tree; public results use sanitized projections.

The all-source coverage configuration includes `src/**/*.ts`, with no application
exclusions. The final run measured 98.88% statements, 94.66% branches, 100% functions
and 99.32% lines across all six application modules. The small gaps are the entry
point catch branch, a stale-frame guard and the device-pixel-ratio fallback. Rendering unit tests exercise error/status behavior;
actual browser screenshots and pixel inspection provide the visual evidence.

Browser checks launch an owned Chrome context and an owned loopback Vite server
on port 4174, with strict port selection and no server reuse. Playwright closes
those resources after each run. Tests use its clock to control actual browser
animation, not an application debug interface. Desktop is 1280×1000; mobile is
390×844 with a touch-enabled context. No user browser profile is accessed.

## Frozen future task and limits

[Pause/resume/restart v1](../tasks/pause-resume-restart-v1.md) fixes the exact prompt,
behavior, public seams, acceptance commands and 0–2 rubric. Its nine controller
tests intentionally fail because `pause()` is absent; all three browser tests
intentionally fail because Pause/Restart controls are absent. These are separate
from the normal GREEN starter gate. No future implementation or measured outcome
is included. Root coordination freezes artifact hashes and the immutable starter
commit/tag after independent review.

Only Chrome/Linux has been executed. Cross-browser behavior, assistive-technology
usability and physical mobile devices are not established by this fixture. The
moving Canvas game is not a screen-reader-equivalent game, although instructions,
HUD and state feedback are readable DOM text. No reduced-motion decoration is
added; ball/paddle motion is intrinsic to gameplay. The future measured task
supplies pause controls. Publication, measured acceptance, final merge, release
and deployment are separate events.

## Primary references used for dependency and timing decisions

- [Vite getting started](https://vite.dev/guide/): vanilla TypeScript entry and Node compatibility.
- [Vitest coverage](https://vitest.dev/guide/coverage): explicitly include all source files.
- [MDN requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame): timestamp-based motion and background gaps.
- [Playwright clock](https://playwright.dev/docs/clock): control browser animation without production test hooks.

The native Canvas approach matches the small game; a game framework would add
unnecessary machinery. npm registry metadata independently confirmed the chosen
Vite, Vitest and Playwright versions and their Node engines before installation.
