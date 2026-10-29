# Build55 — stable ON ownership and late stylesheet geometry

Version0.0.1 / versionCode55. Owner authorized applying the supplied review after
54 still flashed while navigating/entering video. The proposed explanations are
hypotheses, not a reproduced account trace.

## Review against the actual project

- `update(c)` did call public `FproNoapp.restore()` unconditionally. It now keeps
  reference ownership ON when master enhancement, referenceEngine and appBanner
  remain ON; it restores on OFF, master OFF or switching away from reference.
- The claim that update ALWAYS waits500/1500ms is inaccurate here: its last call
  is already `scan(true)`, which immediately hunts and bypasses interactionBusy.
  Keep that immediate hunt AFTER configuration/CSS installation rather than run
  another full hunt before updating cfg. Identical-settings updates still scan.
- `facebook.js` requires body, but early-start.js already waits for head/body and
  evaluates configured reference+audio+facebook in the same document-start boot.
  No Kotlin/global override or second script registration was needed or added.
- The current document observer already handles child/text/attribute mutations
  throughout the session, including bounded prompt work DURING interactionBusy.
  No second permanent MutationObserver; preserve54 priority discovery and all
  earlier classifiers. No new controlsIn/querySelectorAll materialization.

## Geometry retry / stylesheet events (reference engine)

The existing prompt RAF also services a finite geometry watch:

- At most8 recent semantic CTA cues,45 retry validations per cue per ON session.
  New cues evict oldest when full, avoiding stale-page starvation. Detached
  nodes are pruned. A WeakSet prevents budget restart on owned-style feedback.
- Watch is seeded ONLY by existing structurally guarded prompt queue, not every
  ordinary control. No new document-wide search to populate it.
- Target decisions/structural retry eligibility are read for the full batch
  before any hide writes. Candidates still pass unchanged full safety policy.
- Promote child ownership to verified whole bar atomically; restore child when
  parent takes ownership. Stop retrying promoted bars or rejected structures.
- On exhaustion, retain at most8 cues without scheduling more frames. A real
  stylesheet event can revalidate them later without restarting the45 budget.
- One capture `LINK rel=stylesheet` load listener, gated by current enable state
  and document visibility; NO10-second cutoff. Existing document observer sends
  style-node/text additions/changes to the same bounded replay path, even during
  touch. No second observer or full-page hunt on stylesheet arrival.
- Style replay uses at most8 retained cues +8 most recently owned targets
  (deduplicated, at most16), sharing existing48 pending slots. Master/filter OFF
  cancels the shared frame, empties watch, removes guard and restores ownership.

**Cost/limitations:** this intentionally adds finite RAF work, not “zero polling”.
Up to8 additional retry candidates per scheduled frame, up to360 retry checks
per filled watch cohort; a stream of NEW cues can extend activity. Repeated full
policy checks can force layout/traverse ancestors. Count/retention bounded, NOT
CPU time, selector internals, network delay or a universal speedup. Eight-entry
retention, eviction,45 attempts, hidden documents and54 first-cue discovery still
have limits. CSSOM-only geometry changes after exhaustion without a stylesheet
load or relevant DOM mutation are not continuously monitored. Fallback/standalone
retain their prior scheduler, not this reference-engine geometry watch.

## Engine-owned marker CSS

`FproNoapp.set({noOpenApp:true})` ensures a nonce-aware `fpro-noapp-guard` style:
`[data-fpro-reference-noapp]{display:none!important}`. No generic app/header/body
selector. This protects VERIFIED owned targets against ordinary inline rewrites
even without facebook.js's stylesheet. Inline **!important** can override author
stylesheet important; it still requires the existing observer/revalidation path.
No false claim that the guard defeats every possible site style rewrite.

## Evidence

- Actual54 assets FAIL new55 stable-ON ownership test;55 PASS.
- New local suite: master/filter/engine OFF, background ON->ON preservation,
  immediate enable, CSSOM-only late fixed-bar promotion, marker CSS existence,
 45-check exhaustion/no continuing geometry, stylesheet event after simulated
 20seconds, Search recycling, detach/OFF cancellation,8-cue cap and latest-cue
  starvation regression.
- All15 local suites pass on the implementation; no old timing/safety assertions
  weakened. All5 classifier functions unchanged from54/owner-confirmed52, BOTH
  engines: isAppPrompt, appPromptText, navigationCaption, appNavigationSurface,
  safeAppPromptTarget.
- Native fixture preserves26 checks in fallback mode; reference mode adds4:
  child initially hidden, whole-bar promotion after late CSS, engine CSS cascade
  with main stylesheet disabled, ON->ON update without restore.30 in reference.
  jsdom is NOT used to claim browser CSS cascade.

## CI on exact production e9c520a097f3a5a19c70af2fd1b4e93124c0a3df

- Build, unit tests, lint and15 DOM suites: **PASS**.
  https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40590931930
- Focused Android13: **all4 required tests PASS**, no missing/skipped results;
  native prompt fixture26 fallback /30 reference assertions.
  https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40590931965
- Wider matrix: **1/4 PASS**, compact API36. Debug API29/35 fail real-tap
  playback prerequisite in zzPictureInPictureUsesRealPlaybackAndHome. Compact
  API35 fails in emulator-runner with exit1 and no test report/diagnostic files;
  exact cause unknown. Do not claim this was a passing test or dismiss failures
  as harmless/infrastructure. No unrelated production media/settings rewrite.
  https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40590931924
- Source also includes an extra local55 pointer-held/style-node replay assertion
  added after those CI runs. PASS locally against identical production assets;
  it was not yet in the above15-suite CI run.
- Recommended test APK is compact artifact12773878457 from the passing API36
  device job; focused Android13 separately verifies the modified prompt logic.
  Status/explicit result/error evidence checked with GitHub API annotations;
  no claim of downloaded full XML/pixel-report inspection in this sandbox.

These
fixtures are not a signed-in account, throttled cellular/compositor capture or
universal zero-flash proof. No unrelated production Kotlin/refresh/Copy/audio/
PiP/video rewrite. Keep existing sign-in data on APK signature mismatch.
