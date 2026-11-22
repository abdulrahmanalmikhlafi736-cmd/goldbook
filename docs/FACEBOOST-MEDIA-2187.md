# Faceboost 2.18.7 — Like intent + home-only left swipe

## Delivery

- Package: `com.almekhlafi`; versionCode `2180007`; unchanged signing configuration.
- Tested commit: `d5881065ca9ddbdd364b7603a530092101091baa`.
- Successful run: https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42424922501
- APK candidate: https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42424922501/artifacts/13595183414
- Inside archive: `FPRO-2.18.7-media-candidate.apk`.
- Full exact patched source and fixture APKs: build-inputs artifact `13594388870` on the same run.
- Native fixture evidence: artifact `13594859393`.

Install over 2.18.6 without uninstalling. Certificate identity has not been
independently inspected locally; original signing configuration was preserved.
Candidate archive size is 3,049,796 bytes, NOT an independently measured APK size.

## Precisely what changed

The inherited double-tap Like dispatched its own click while its 150ms capture
swallow was active, then animated even if no button was found or nothing changed.
The replacement grants an exception to exactly the approved MouseEvent instance,
not all clicks or the replay guard. It resolves the rail within the current
video's private scope (or one explicitly labeled eligible portal target), refuses
ambiguity/offscreen targets, dispatches once and observes a bounded official
boolean state transition before animating. Merely adding aria metadata or
refreshing an image cannot produce a false success. Pending intentions cannot
retry blindly. CurrentSrc, src attribute, source children, route, element and
active video identity are checked to discard stale results during recycling.

The new home module gates a deliberate one-finger left swipe only on Facebook
`/` or `/home.php` feed contexts. Root media/story query contexts and non-home
routes are excluded. Vertical/right gestures, native edges, selection, controls,
explicit story buttons and identifiable horizontal carousels are exempt. Visible
modal interaction is not intercepted. It does not delete story creation or
synthesize cancellation/site events, rewrite history, impose global touch-action
CSS, add polling, or continuously observe the feed.

## Preservation evidence

Freshly applied 2.18.6 and 2.18.7 to the same pinned source and compared every file.
Only six differ: version metadata; expanded androidTest fixture; new home module;
media helper version-comment only; asset loading list; and Like portions of raw
reel gestures. The complete media helper implementation is identical after its
first version-comment line. Thus the accepted footer lowering and upper 40%
fullscreen implementation are unchanged. `facebook.js`, `reel_controls.js` and
`MainActivity.kt` are byte-identical. Detailed hashes are in
`FACEBOOST-MEDIA-2187-SOURCE-COMPARISON.json`.

## Validation actually performed

- Fresh pinned-source apply, JavaScript syntax checks, and **36/36 local tests**.
- Same DOM/production-script suite required by the successful CI build.
- Release, debug and instrumentation APKs built successfully (6m4s build job).
- **6 controlled real-Chromium WebView fixtures on Android 13 passed** (2m35s
  fixture job): inherited viewport footer, hidden-dialog/remount, download source,
  top-only entry; plus fast Like official-button transition and home left versus
  vertical gesture dispatch. Workflow requires `OK (6 tests)` before publication.
- Candidate publication job succeeded. API status and artifact metadata are in
  `FACEBOOST-MEDIA-2187-EVIDENCE.json`.

## Honest acceptance limits

Synthetic controlled DOM/WebView fixtures are not trusted physical touches or a
logged-in account. An official button UI transition can be optimistic and is NOT
proof of server persistence. Facebook may attach earlier window listeners or use
account-specific containers; the home guard intentionally fails open for ambiguous
interactive/carousel regions. Owner confirmation on the phone is still needed
for both Like persistence and the unwanted Create Story gesture. No full inherited
unit/lint suite, thermal measurement, security certification or account acceptance
is claimed. No change to deferred selection/audio/CTA/security work.

No Compose UI rewrite was required. Standing official Compose reference:
https://developer.android.com/develop/ui/compose/documentation?hl=ar
