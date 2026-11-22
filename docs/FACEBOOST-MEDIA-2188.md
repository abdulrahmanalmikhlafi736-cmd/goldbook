# Faceboost 2.18.8 — home swipe follow-up

## Owner feedback

Like in 2.18.7 is explicitly confirmed repaired. Home swiping still opens Create
Story, as shown in two supplied screenshots. The owner is uncertain of horizontal
direction in RTL. This report does not retroactively claim 2.18.7's home guard
worked or establish Facebook's exact internal gesture implementation from images.

## Delivery and validation

- Successful tested commit: `797ddb8df88b8f26dcf807cbb40ec7c416b18a23`.
- Run: https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42426818482
- APK: https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42426818482/artifacts/13596356384
- Inside ZIP: `FPRO-2.18.8-media-candidate.apk`. Install over 2.18.7, no uninstall.
- Exact patched source + fixture APKs: build-inputs artifact `13596465439`.
- Chromium evidence: artifact `13596490196`.
- `com.almekhlafi`, versionCode 2180008, original signing configuration retained.
- 40/40 local policy/DOM/production-script cases passed; same CI DOM gate passed.
- Release/debug/instrumentation APK build succeeded in 6m20s.
- All **7 controlled real-WebView fixtures on Android 13** passed in 2m39s.
  Publication requires `OK (7 tests)` and rejects failure/crash output.
- New fixture invokes the production native installer BEFORE an intercepted HTTPS
  page loads. The page installs its own WINDOW capture listener in its head. Both
  horizontal directions are suppressed before that listener, while vertical
  movement and button clicks pass. Thus early registration is actually exercised,
  not merely simulated by installing an ordinary listener after page load.

## Scoped changes

Inspection found no native horizontal handler opening the story composer. Three
weaknesses in the previous guard were directly reproducible in controlled cases:
late installation after site window listeners; broad exemptions for button
ancestors and viewport-sized horizontal paging containers; and one-direction-only
intent matching. These are demonstrated weaknesses, not account DOM proof.

The new native `HomeSwipeGuard.install` uses existing AndroidX WebKit 1.13.0's
DOCUMENT_START_SCRIPT feature before initial navigation. It targets HTTPS Facebook
origins only. The original engine injection remains a fallback if the WebView
feature is unsupported. No WebKit/dependency upgrade was needed.

The once-per-document module gates deliberate horizontal gestures in either
orientation on ordinary Facebook home routes. Normal button/link taps and vertical
scrolls are not swallowed. A full-height overflow shell no longer counts as a
photo carousel. Editable areas, sliders, selected text, system edges, identifiable
compact galleries and story trays remain exempt. Modal, fullscreen, non-home and
root media/story-viewer contexts are excluded.

No global touch-action CSS, DOM deletion, website synthetic cancellation, native
MotionEvent interception, periodic scan, navigation/history replacement or forced
story-page redirect was introduced. Explicit story creation remains available.

## Preservation

A fresh 2.18.7/2.18.8 apply to the same pinned source has precisely six changed
files: version metadata; expanded instrumentation test; home JS; version comment
only in media JS; main WebView's early-install call/import; new installer utility.
The ENTIRE raw reel gesture script, including the owner-confirmed Like fix, is
byte-identical. So are facebook.js, reel_controls.js, MainActivity.kt and the
background audio WebView class. The full media helper is identical after its first
version-comment line, preserving footer geometry and fullscreen logic.

Hashes: `FACEBOOST-MEDIA-2188-SOURCE-COMPARISON.json`.
Status/artifact metadata: `FACEBOOST-MEDIA-2188-EVIDENCE.json`.

## Acceptance limits

These are synthetic controlled WebView events, not native finger-motion or
signed-in account acceptance. Unknown site/account structures, fullscreen-sized
carousels, earlier non-JS native/compositor behavior and unsupported old WebViews
may differ. Owner verification of this version's home swipe remains pending.
No full inherited unit/lint suite, heat test, security certification, local APK
certificate check or independently measured APK size is asserted. Archive sizes
in evidence refer to ZIP artifacts only. Deferred CTA/selection/audio work remains
untouched.

No Compose UI rewrite was required. Standing Compose reference:
https://developer.android.com/develop/ui/compose/documentation?hl=ar
