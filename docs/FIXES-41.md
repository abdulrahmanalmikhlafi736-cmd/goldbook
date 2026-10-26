# Build41 — reaction gestures, copy stability and browsing workload

## Report and evidence boundaries

Owner reports that browsing eventually stalls, text copy stops, and holding Like
no longer opens reactions although tapping still applies 👍. No authenticated
account trace, heap snapshot or physical-phone performance trace is available.
The fixes below address reproducible code-level defects; they do not establish
that every Facebook freeze has the same cause.

## Causal reproductions

1. The build23 reading guard stops pointer/touch/contextmenu propagation for
   text classified as reading, deliberately WITHOUT cancelling native defaults.
   Exact action-label comparisons miss compound/localized reaction controls
   (e.g. `role=button`, aria-label `Like this post, 12 reactions`, visible
   `إعجاب · 12` inside an article). The fixture confirms delegated pointerdown
   was swallowed while click was not. That directly explains why a site's
   long-press timer cannot start while its ordinary click can still work.
2. The reference engine's paint and hidden Maps strongly retained detached DOM
   until palette/feature restoration. Repeated virtualized-card removal thus
   accumulated records even though their nodes were no longer on the page.
   This is a demonstrable retention mechanism, not measured Android heap use.
3. Fast-path querySelectorAll materialized entire descendant lists before the
   later paint-count limit. Full scans also recolored/reset styles during held
   gestures and selection. These are avoidable main-thread work and selection
   hazards, not proof that the owner's stall was solely CPU or memory pressure.

Reproduce the structural before/after comparison:

```sh
npm ci --prefix tools --ignore-scripts --no-audit --no-fund
node tools/measure-interaction.cjs 2053506
```

The comparison requires a Git checkout with the baseline commit available; the
clean source ZIP builds and runs the regression suites without Git history.

| Deterministic fixture metric | Build40 baseline | Build41 |
|---|---:|---:|
| Reaction pointerdown reaching delegated site handler | 0 | 1 |
| Descendant matches materialized by fast query over 3,000-node fragment | 3,000 | 0 |
| Detached paint records after 40 × 64 removed nodes | 2,560 | 0 |
| Detached CTA records after 40 removed cards | 40 | 0 |

The zero descendant-NodeList count means TreeWalker replaced collection, NOT
zero traversal. Fast reference queries visit at most 384 descendants per query;
fast hashtag work shares a 384-visit batch budget. These numbers are structural
counts, not heap bytes, frame rate, stall duration or an account benchmark.

## Implementation and deliberate trade-offs

- Preserve the build23 reading core/golden fixture, adding only action exclusion
  and nested role-button CSS isolation. Identify action ancestry by semantic
  controls, reaction URL/sigil/testid, localized aria/title, exact/counter labels,
  and toolbar/menu boundaries. Do not classify arbitrary prose starting `Like…`
  as an action. Unknown standalone role-buttons stay with the site; real reading
  blocks inside interactive post/comment wrappers still use native selection.
- Observe held pointers/touches without preventDefault or stopPropagation. Defer
  full recoloring/filter/layout while held or while Selection is noncollapsed;
  allow 250ms quiet time after release. This includes native selection handles.
  A persistent selected range intentionally suspends broad recoloring until
  cleared; navigation/feature setting changes can explicitly replace config.
- Coalesce background full scans, with at least 1,500ms after the prior full scan
  finishes. Ordinary feed filters/story cleanup can consequently wait longer
  than the old 500ms scheduler, and remain deferred during an active selection.
  This is intentional, not hidden by the changed 1,800ms filter-test waits.
  Explicit config changes still apply immediately. No-app CTA fast detection
  remains before-paint and runs even during a hold; direct control roots get
  priority over newly inserted feed text. Selection feature handlers stay live.
- Queue at most 32 changed color roots for replay after interaction; full pass
  covers overflow. Use bounded TreeWalker fast descendants, no geometry work in
  the immediate reference path, and prune detached paint/CTA records before a
  settled full scan. Restore owned styles before forgetting detached nodes;
  preserve independent site style updates and allow reinserted nodes to recolor.
- Add only bounded numeric work counters/timings and interaction boolean to the
  existing explicit private diagnostic. No text, URLs, account data, upload,
  telemetry service, extra MutationObserver or periodic polling loop.
- No production Kotlin/player/recovery/fullscreen changes: preserve35 geometry,
  emoji size/download,36 private recovery, and40 portrait-first fullscreen gate.

## Tests

Local PASS: syntax checks, `test-injection.cjs`, `test-browsing.cjs`,
`test-interaction.cjs`, `git diff --check` and the comparison above. The new DOM
suite tests Arabic/English/enriched/nested actions, reading prose, held pointer
and touch-only fallback, active selection, real color replay, urgent CTA hiding,
bounded roots/traversal, 2,560-node detached cleanup and recycled-node/site-style
preservation. The untouched build23 golden core is still compared after stripping
only the two declared action-isolation additions.

New Android instrumentation `InteractionRegressionTest` injects OS touch down/up
and a one-second hold into a real WebView with ongoing 40ms feed mutation. It
requires normal Like click, the delegated long-press reaction palette, no extra
Like on hold, continued mutation callbacks and no full scan during hold. Existing
native post/comment/hashtag/direct-div selection and Android Copy-action tests
remain required; no fake native Copy UI was added. Both are controlled fixtures,
not the owner's account. [Explicit XML inspection 40269393801](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40269393801)
asserts **both native Copy and held reactions PASS on API29 and API35**. Earlier
[inspection 40269307248](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40269307248)
also confirms player-overlay35 and browsing-history/recovery/fullscreen-policy
regressions on both APIs. Fullscreen sensor poses and ten-minute clock are
injected/simulated by those existing policy tests, not physical-phone/account
proof.

[Android build/lint/JVM/three DOM suites 40268749851](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40268749851): **PASS**.
Production/test app source: `b4e6424b4e0a2da9aa5bf9ebb6f14b01a03fbb5d`.
[Device matrix 40268749771](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40268749771): **2/4**, NOT an all-green run.
API35/36 compact PASS. API29/35 debug both fail the existing PiP test prerequisite
`A real tap must start playback while ordinary gesture policy is enabled`.
The new input test and existing native Copy assertions pass on both despite that
separate failure; no PiP test was disabled or counted successful.

[Exact compact APK verified on API35](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40268749771/artifacts/12626888913), artifact ZIP 1,014,953 bytes.
[Clean complete source](../downloads/FPRO-build41-source.zip) and adjacent SHA256
include the build/test project without dependencies, APKs, keys or old archives;
SOURCE-COMMIT.txt records the archived snapshot and exact tested app-source SHA.
[Pull request 3](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/pull/3)
is separate from already-merged PR2; it has not been merged automatically.

Remaining limitation: the legacy full tint/whole-document pass is still
synchronous once interaction settles. Connected, very large feeds can therefore
still cause a long task. This patch bounds the immediate traversal, avoids
recoloring during gestures and stops detached reference-map growth; it does not
claim a complete incremental renderer or guaranteed smoothness on every phone.
