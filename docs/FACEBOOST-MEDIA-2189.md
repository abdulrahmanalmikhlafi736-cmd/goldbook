# Faceboost 2.18.9 — owned seek gesture isolation

## Feedback and concrete defect

Owner confirms Like remains fixed, but 2.18.8 did not stop Create Story, including
when dragging the home-feed progress bar backwards. Earlier home fixtures never
exercised a range drag. The previous guard explicitly exempted inputs/Fpro tools;
the seek's target-level pointerdown stop was too late for site window capture,
and its complete touch/move/end sequence was not isolated. This defect is directly
established from source; it does not establish every internal Facebook gesture
mechanism from screenshots alone.

## Delivery

- Tested commit `0525d143551b84a6ef758e6ae6c2dd5f1857690b`.
- Run https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42428432190 — SUCCESS.
- APK https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42428432190/artifacts/13597190914
- ZIP contains `FPRO-2.18.9-media-candidate.apk`; install over current, no uninstall.
- Exact patched full source and fixture APKs: build-inputs artifact `13596945558`.
- Native instrumentation evidence: artifact `13597165871`.
- Package `com.almekhlafi`, versionCode 2180009; signing configuration unchanged.

## What changed

The existing document-start module now routes app-owned range/track/emoji targets
BEFORE its broad input exemption. Only a range carrying the controller's function
hook is eligible; normal website ranges are not captured. It consumes the complete
pointer/touch start/move/end/cancel sequence before subsequent page capture
listeners, takes pointer capture where possible, and directly invokes the bound
video's seek operation. No synthetic DOM/site event is dispatched.

The controller maintains drag state and maps CSS x coordinates to a clamped
fraction/duration. It supports outside-range dragging, touch-only fallback,
pointer+touch deduplication, cancellation, disconnected controls and source-change
checks. A new primary pointer clears stale ownership. Keyboard/accessibility
input/change retain the existing behavior.

`touch-action:none` applies ONLY to the app's 32px track and its seek input, not the
page or ancestors. Scrolling elsewhere retains its existing policy. No timers,
MutationObservers, refresh/reload, history rewrite, composer deletion, DOM-hiding
race or native MotionEvent interception was added. Other home swipe policy remains
as in 2.18.8; this patch specifically closes the known owned-control exemption.

## Validation actually completed

- 47/47 local DOM/policy/integrated production-script cases passed.
- Same suite passed the CI gate.
- Release, debug and test APK build succeeded (8m42s job).
- All 8 controlled real-WebView fixtures on Android 13 passed. Workflow requires
  `OK (8 tests)` before publishing the candidate.
- New eighth fixture uses the production document-start installer and a page-authored
  WINDOW capture listener registered in the intercepted HTTPS document head. A
  backwards pointer+touch range drag changes the bound video's time while ZERO
  control events reach page capture. Touch-only fallback and actual Chromium
  computed touch-action are checked too. jsdom cannot model this CSS property;
  no claim is made that its CSS behavior was proved in the DOM harness.

## Preservation proof

Fresh 2.18.8/2.18.9 applies to the same pinned source differ in exactly four files:
version metadata, expanded native fixture, media controller, and control router.
The entire Like/reel gesture script is byte-identical, as are facebook.js,
reel_controls.js, native main WebView, MainActivity and document-start installer.
Viewport/footer/fullscreen policy prefix is identical after the version comment.
No geometry, emoji/line styling or upper fullscreen policy was changed. Complete
hash comparison: `FACEBOOST-MEDIA-2189-SOURCE-COMPARISON.json`.
Status/artifact metadata: `FACEBOOST-MEDIA-2189-EVIDENCE.json`.

## Limits / acceptance still pending

Tests use synthetic controlled browser events, not trusted physical swipes on a
logged-in Facebook account. They demonstrate control-routing and state behavior,
not universal elimination of every story gesture. Account DOM, compositor/native
scroll behavior and unsupported old WebViews may differ. Owner phone verification
of both the range and ordinary home swipes remains pending. Do not label this a
confirmed root fix of all story entry paths or promise zero lag/heat. No full
inherited unit/lint suite, heat measurement, local certificate or exact APK-size
inspection was done. Artifact sizes refer to ZIP archives only.

No Compose UI rewrite was needed. Standing reference:
https://developer.android.com/develop/ui/compose/documentation?hl=ar
