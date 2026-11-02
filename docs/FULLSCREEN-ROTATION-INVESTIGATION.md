# Fullscreen rotation investigation — historical state at 447fdeb

Subsequent tested build-67 work is documented in [FULLSCREEN-ROTATION-67.md](FULLSCREEN-ROTATION-67.md). The failed candidates below remain rejected.

Date: 2026-11-01.

## Owner report and historical review

Double-tap enters fullscreen, but turning the phone to landscape exits fullscreen instead. The production rotation gate, fullscreen entry/exit methods, `facebook.js` gesture implementation and manifest configuration handling were not changed between the merged base 908a706 and delivered build 66 (765887a). This does not establish which site/provider/device change caused the owner-visible regression. The feature was not intentionally removed.

The old rotation-gate instrumentation used a synthetic `View` and checked orientation requests, not a real video player surviving an actual landscape window. It did not prove the reported interaction worked.

## New reproduction

`FullscreenRotationRegressionTest` uses real Android touch injection through a player cover, actual H.264 video, the production double-tap handler, real WebChromeClient fullscreen and an actual landscape window. Sensor samples are injected into the production gate, and window orientation is then forced in the emulator: this is **not evidence from physical accelerometer hardware or the owner's Facebook account**.

The local page deliberately models a responsive SPA replacing its video on a viewport breakpoint. This is a demonstrated failure pattern, not proof that authenticated Facebook uses precisely this handler. Required assertions remain: fullscreen survives the turn, custom surface fills landscape, no player remount, frames continue, Back returns to portrait without navigating/reloading the document. No assertions were relaxed to declare success.

Baseline [run 41244936256](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41244936256): API 35 fails `Responsive resize must not exit the native player`; API 33 misses the landscape state (which can be transient when fullscreen exit restores portrait). Both are failures, not passing compatibility results.

## Rejected candidates

1. Freezing the original WebView layout did not protect the actual fullscreen renderer. Run 41245257673 failed on both APIs. Chromium's `AwContents.FullScreenState` hands the renderer to a separate FullScreenView; changing the old embedded View's dimensions alone is insufficient. Source consulted: https://github.com/chromium/chromium/blob/main/android_webview/java/src/org/chromium/android_webview/AwContents.java .
2. Capturing resize/orientation events only during a managed double-tap session also did not solve the native reproduction, including a pending-transition variant. Runs 41245668814, 41246001610 and 41246420999 failed. DOM checks/build/lint success did not count as native correctness.
3. Latest trace (41246420999, API 33 job 124670686248 / API 35 job 124670686138) shows portrait fullscreen, landscape resize while fullscreen/native flags are true, fullscreen exit, then return to portrait; the fixture remount count is 2. Exact annotations are retained in `FULLSCREEN-ROTATION-INVESTIGATION.json`. This still does not establish the authenticated site's exact event/DOM ownership sequence.

## Safe end state

**All candidate production changes and the provisional version-67 bump were reverted.** `app/src/main`, `app/build.gradle.kts`, and the existing DOM suite source match the delivered build-66 baseline 765887a. Only regression instrumentation, its workflow and investigation evidence remain new. No candidate APK was supplied to the owner. PR remains open/unmerged.

Next investigation should instrument the exact site-handler/fullscreen-callback order and verify the failure without assuming the late event guard runs before an older site handler. A successful actual player rotation test is required before shipping another rotation fix. The owner still needs confirmation on the real device/account even after fixture tests pass. Mandatory Compose reference: https://developer.android.com/develop/ui/compose/documentation?hl=ar (no Compose production changes made here).
