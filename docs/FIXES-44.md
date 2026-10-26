# Build 44 — official WebView lifecycle upgrade

Target: personal Note 20 Ultra / Android 13. Minimum Android 7 (API 24),
WebKit 1.16.0; compile SDK 36, target SDK remains 35. Version name remains 0.0.1.

## Implemented

- Application-owned official asynchronous `startUpWebView` with a single executor,
  typed success/error callback and executor shutdown. Activity draws a native
  loading frame and waits without blocking the UI; no UA, cookies or WebView
  constructor before completion. Lifecycle cancellation releases the Activity.
  A 20-second wait reports failure rather than retrying initialization forever.
- Existing meaningful-page-ready splash and navigation/session logic retained.
- Renderer termination removes/destroys the dead instance and replaces it below
  the existing Compose controls. Invalidates all three query channels, releases
  fullscreen/file chooser/audio ownership and resets PiP. Restores only a native
  checkpoint/eligible URL, never queries the dead renderer. One automatic reload
  per Activity lifetime; another termination requires an explicit user retry.
  DOM, unsent text and playback cannot be promised to survive renderer death.
- Origin-restricted `addWebMessageListener`, main-frame + sender + HTTPS checks,
  string-only bounded JSON, strictly boolean playback state, throttled geometry.
  No `addJavascriptInterface` fallback: older providers use the existing bounded
  page-info pull channel. Header polling remains single-flight intentionally;
  changing it to events is not smuggled into this lifecycle upgrade.
- Playback report includes visible-viewport-adjusted video geometry and intrinsic
  video size. Convert to screen coordinates with current WebView location/scale,
  clip to visible bounds, clamp PiP ratio safely inside platform limits. Use
  fullscreen view bounds when applicable. Scroll/resize geometry updates are
  coalesced and idle when not playing; unchanged reports are not resent.
- Explicit DevTools switch follows `BuildConfig.DEBUG`, including disabling it
  for minified compact/release. Debug certificate does not imply debuggable.
- Teardown removes listener, gesture callbacks and clients, detaches, stops,
  clears history and destroys. Dead renderer teardown skips stop/history calls.
  Existing explicit audio-owner release retained; no speculative WeakReference.
- Diagnostics include async startup duration, bridge availability, recovery count
  and app PSS (explicitly NOT renderer PSS). No new page text/cookie logging.

## Verification and limits

Local: syntax checks + four existing DOM suites passed after the upgrade.
JVM recovery-budget tests added. Device tests await real asynchronous browser
attachment, rather than assuming Activity resumed implies WebView ready.
Added native bridge test: real main-frame message accepted, same-origin iframe
message and malformed/non-boolean messages rejected.

Verified production app source is byte-identical from `16fd76c` through `0a27292`
and the Android13 gate commit `6a083c7` (later commits refine test fixtures/workflows).

- [Build / lint / JVM / four DOM suites / debug + compact APKs](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40410738982): PASS, tested commit `0a27292`.
- [Android13 focused gate](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40411515373): all three upgrade tests PASS, no skips. This exercises the callback recovery contract, not a real OS low-memory kill.
- [Full device matrix](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40410738983): **2/4**. Compact API35 and36 PASS. Debug API29 and35 fail the existing real-tap video-playback prerequisite in `zzPictureInPictureUsesRealPlaybackAndHome`; no assertion was disabled. Do not call the full suite green or PiP/audio playback proven.
- [Explicit native XML inspection](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40411631535): Copy, held reactions, recovery callback and playback reporting PASS on both API29/35; origin/frame/malformed bridge test PASS on35. It is explicitly SKIP on29 because that stock provider lacks WEB_MESSAGE_LISTENER, while its separate, non-skipped fallback test PASSes.
- The initial bridge fixture gave a false playback hint on an empty page; the real page-info reporter could immediately revoke it. The corrected fixture uses intercepted HTTPS navigation, verifies its own DOM marker, keeps synthetic video state consistent, and prevents subsequent page probes masking illicit iframe state changes. Original security assertions remain.

No authenticated Facebook, actual Note20 Ultra, long-session renderer PSS or
startup before/after measurement has been performed. No speed percentage or
freeze-resolution claim is made.

## On-device memory / performance protocol (debug only)

1. Record `adb shell dumpsys webviewupdate`, cold-start diagnostics and app PSS:
   `adb shell dumpsys meminfo com.almekhlafi.FPRO`.
2. Repeat after 10–20 minutes of the same feed, media, native Copy, long-press
   reactions, website pull refresh, Home/PiP, audio-only and screen lock.
3. Use `adb shell dumpsys activity processes` and `adb shell ps -A` to identify
   the *associated isolated renderer PID*, not an arbitrary Chrome renderer;
   record `adb shell dumpsys meminfo <actual PID>` separately. PID changes after
   renderer replacement. Never interpret app-only PSS as total WebView memory.
4. Use Chrome DevTools locally for JS heap/DOM/long tasks; Perfetto for Android
   main-thread stalls. Do not upload authenticated page snapshots or cookies.
5. Compare repeated checkpoints and destroyed Activity/WebView retention. Memory
   not immediately falling after destroy alone is not evidence of a leak.

Preserved: build43 selection/action behavior, website-native pull refresh only,
Seal-only downloads, portrait/fullscreen turn gate, cookies, back handling.
