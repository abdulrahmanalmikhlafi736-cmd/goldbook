# FPRO 67 — tested fullscreen rotation fix

Date: 2026-11-01. versionCode 67; versionName remains 0.0.1.

## What was established

The previously rejected late resize guard was not effective. A real Blink measurement found that an older listener on the **window target** executes before a subsequently registered capture listener. jsdom's ordering differed in this case; a passing jsdom test was not evidence of correct Blink ordering. `FULLSCREEN-ROTATION-67-BLINK.json` records the actual HeadlessChrome/133.0.6943.0 result: early guard protects the session; late guard does not; releasing the early guard restores the site callback. This measured ordering is specific to this window-target case, not a claim about all DOM capture events.

## Small production change

- `fullscreen-rotation.js` registers the guard at document start, before Facebook's scripts/listeners, for the existing allowed Facebook/Messenger origins and main frame only. Repeated injection is idempotent.
- Only FPRO double-tap entry activates it, before the fullscreen request. It prevents site window resize/orientation-change listeners from tearing down the player during that owned session. Actual Android orientation, CSS layout, Chromium rendering and video frames continue.
- Native Back/cleanup, browser fullscreen exit and failed entry release it. Normal browsing and unmanaged fullscreen do not activate it. No site event is synthesized; no site API is monkey-patched. No additional timers, DOM observers, feed scans, downloads or production dependencies were introduced.
- Rotation gate and portrait-first entry policy remain unchanged. No changes to the verified app-prompt engine, themes, selection/comment policy, Reels route fix, media workload optimization or feed-return implementation.
- Providers without document-start support retain late-injection fallback, but late registration cannot guarantee protection from already-registered site listeners. No universal old-provider compatibility claim is made.

## Verification

**Complete native test:** [run 41248934971](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41248934971), API 33 job 124678152370 PASS and API 35 job 124678152101 PASS. Uses the full production injection path at a Facebook-origin-shaped offline page, an H.264 asset, trusted double taps, real WebChromeClient fullscreen and actual landscape window/layout. Verifies no responsive player remount, continued decoded frames, focused fullscreen input, one Back returning to portrait, same document and guard released. Sensor samples are injected into the real gate and the emulator window orientation is forced; this is not a physical accelerometer or logged-in account test.

The preceding run 41248526703 passed rotation/frame/remount checks but failed Back on both cold emulators. The successful run confirmed Android's immersive onboarding with `settings put secure immersive_mode_confirmations confirmed` and additionally asserted input focus. No production Back code was changed to bypass this failure and the single-Back assertion was not weakened. The general device workflow uses the same explicit system onboarding setup.

All **26 DOM suites PASS** locally on Node 24.22.1 (`.cache/fullscreen67-dom.log`, non-distributable). [APK build 41248573633](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41248573633), commit `34b78c9d75d6225fabb5aa720cfa3a78a4b6d176`, also passed injected-page suites, unit tests, Android lint, debug assembly and compact assembly. The native successful test commit 402704c has identical production sources/build configuration; it adds test focus/onboarding setup only. Later documentation/general emulator setup does not change the APK.

This is targeted verification; it does not claim the whole legacy multi-provider device matrix is green. Earlier broad audit findings remain documented separately. No claim of heat, battery, every-video compatibility or all future crash freedom is made.

## Deliverable

[Download compact build 67, about 1.1 MB](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41248573633/artifacts/13060736178).

GitHub supplies a ZIP containing the compact APK. Select this compact package, not the separate large debug artifact. No PR merge was performed.

Owner acceptance: on the actual phone/account, double-tap a video, turn the phone landscape, confirm uninterrupted fullscreen playback, then use Back and confirm portrait browsing returns. The responsive fixture establishes a tested failure pattern/fix, not proof of the exact authenticated Facebook implementation. CSS/media-query/ResizeObserver-driven site changes are not globally intercepted by this guard.

Mandatory Compose reference retained: https://developer.android.com/develop/ui/compose/documentation?hl=ar . No production Compose or BackHandler code was changed for this fix.
