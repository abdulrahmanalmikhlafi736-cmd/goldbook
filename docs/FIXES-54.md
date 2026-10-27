# Build54 — priority discovery beyond the fast wrapper-visit limit

Version0.0.1 / versionCode54. Owner still observed brief appearance entering other
interfaces after53. The proposed review identified a REAL coverage limitation:
fast traversal counts generic DOM elements, not just semantic controls. This is
reproduced below, NOT claimed proven as every account-side flash's cause.

## Implementation

For each of at most FOUR newly added roots in the existing mutation callback,
perform one native exact-aria selector probe (root.matches, then at most one
querySelector). It returns only the first cue matching the existing finite
canonical app-action labels. Place this cue before the existing bounded generic
candidates, and run the UNCHANGED complete classifier/ownership pipeline.

No querySelectorAll result collection for this probe; no 600-result slice after
an unbounded result collection. No increase of generic384 visits,48 pending
candidate cap or root count. Routine wrapper class/style changes and late
navigation-peer checks do NOT run this priority lookup, avoiding repeated broad
queries during header animation. Existing53 before-paint grouping remains.

Native selector lookup can still traverse a large subtree internally. We bound
probe COUNT/output, NOT CPU time or internal engine allocation. No claim of O(1)
lookup or a hard traversal budget. Each engine's existing timing API now exposes
priority.{queries,hits,maxMs}: queries counts logical root probes (root match +
at most one descendant lookup), hits is a found cue, NOT successful hiding;
maxMs measures the probe, not total frame time. Native fixture records combined
discoveryMs and both engine counters in its diagnostic detail. No raw labels,
URLs, classes, IDs or account text are emitted by those counters.

Deliberate limitations: only first exact literal cue per added root; canonical
literal/ASCII-case matches, not all normalized label/branding variants. A first
cue rejected by safety policy or a cue inside an already-hidden parent can stand
before another later cue; generic discovery/fallback still applies. Additional
roots beyond four, text-only/unlabelled CTAs, and class-only transitions deep in
an existing huge subtree are not universally covered. No zero-flash guarantee.

## What was NOT added from the proposed patch

- No second document-start registration: existing installEarlyScript is already
  registered before first loadUrl and supplies settings in the same bootstrap.
- No second noOpenApp preference/global; no unconditional initial enable that
  could ignore master/reference/filter settings.
- No overlapping8-second observer, production timer or dependency on only
  DOMContentLoaded/load events. Existing current-Document observer remains.
- No blanket CSS/parent/body/header/video concealment. Five classifier functions
  remain byte-identical to owner-confirmed52 in BOTH engines.46 black-strip and
  Search/account/modal/forms/media protections remain. No production Kotlin,
  Manifest, early-start, Copy, website refresh, selection/PiP/audio changes.

## Regression evidence

- New three-mode54 test adds ONE root containing3000 ordinary wrapper elements
  before a real four-control fixed navigation/video structure with exact-aria
  CTA. Actual53 assets FAIL before-next-frame assertion.54 PASSes, retaining
  root/viewer/video/Search/profile/Back and restoring CTA on OFF.
- Additional local test: late inline styling changes the caption fallback from
  oversized399px to eligible124px; existing attribute observation hides it at
  checkpoint without a full scan.53 already tests late navigation evidence.
  This is NOT an external stylesheet download test: CSSOM/link loading that
  changes geometry without a relevant observed DOM mutation is not newly solved
  by this added-root priority probe.
- At most four priority probes in that mutation phase; positive hits and finite
  maxMs are asserted. Existing ordinary-control zero-geometry checks remain.
- All14 local DOM suites PASS, JS syntax/diff checks PASS. No53 classifier or
  prior safety/timing assertion was disabled for this addition.
- Native Chromium keeps prior24 assertions, adds2 for a delayed frame-callback
  insertion containing3000 generic elements before a65px fixed bar with an
  exact accessible CTA. Whole bar must hide at checkpoint before next frame,
  child must NOT be separately hidden, main/body/container remain.26 assertions
  per reference mode. This is native WebView layout, not a private-account DOM
  reproduction, network throttling or compositor-pixel proof.

The selector measurement is diagnostic, not evidence of a phone-wide speedup or
universal latency guarantee. Test the actual account before claiming acceptance.
Do not uninstall/reset sign-in data if installation signing differs.

## CI on production061b622fabf7fd699f06f6062c629e4f901aec2e

- APK, unit tests, lint and14 DOM suites: **PASS**
  https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40584004547
- Focused Android13: **all4 required cases PASS**, none missing/skipped,
  including26 prompt assertions per reference mode. Required-result notices
  checked via GitHub Checks API.
  https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40584004586
- Wider matrix: **1/4 PASS**, compact API35. Debug API29/35 fail the real-tap
  playback prerequisite of zzPictureInPictureUsesRealPlaybackAndHome. Compact
  API36 fails localPagePaintsThroughRealSettingsButton with “Local HTML must be
  accessible in actual WebView”. Causes remain unestablished; not dismissed as
  harmless or infrastructure. No unrelated production media/settings rewrite.
  https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40584004561
- Additional late-inline-styling case was added after these CI runs and passes
  locally in all three modes against the SAME production assets. The14-suite CI
  above did not yet include that additional assertion. Source includes it.

Verified compact API35 artifact12771660896 is the recommended54 test APK.
Native report/log artifact download from this sandbox was blocked by outbound
host restrictions; pass/fail evidence above comes from workflow conclusions and
explicit result/error annotations, not a claim of downloaded report inspection.
