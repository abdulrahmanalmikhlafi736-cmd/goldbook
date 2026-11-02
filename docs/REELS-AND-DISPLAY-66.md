# FPRO 66 — Reels visibility and local diagnostic isolation

Date: 2026-10-31. Version name remains 0.0.1; versionCode is 66.

## Changes

- Reproduced the Reels filter hiding a tracked viewer container when Reels hiding is enabled. Explicit media routes now bypass only the feed-Reels hiding factory. Feed hiding and the other factories remain enabled as configured. Tested home versus `/reel/42/`, `/reels/42/`, `/watch/?v=42`, `/user/videos/42/`, `/video.php?v=42`, and `/?v=42`.
- The offline display diagnostic now uses an independent fullscreen Dialog/WebView, not replacement of the live Facebook document. Back destroys that surface and resumes the preserved document; Activity destruction releases it. The diagnostic has no native bridge, rejects permissions, disables file/content access and mixed content. It is excluded from automatic video PiP; dismissal restores normal PiP policy.
- No changes to the owner-confirmed build-62 app-prompt hiding engine, post/comment selection policy, or feed-position restoration implementation. Copy and the account-reported feed-position issue remain outside this fix.

## Verification and limits

1. All 25 DOM suites pass on Node 24.22.1, including the Reels reproduction/regression. Local final log: `.cache/reels66-final-local.log` (not a distributable).
2. Android 13 native Reels + diagnostic lifecycle/PiP-policy tests: [run 41228128957](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41228128957), job 124616478637, both PASS. Actual trusted tap opens a visible fixture player; 41 decoded frames, opens=1, errors=[]. Diagnostic checks preserve document identity/history, release the window on Back/destroy, and suppress PiP for the diagnostic while retaining the normal playing-state policy. Reflection is confined to instrumentation, not production hooks. This is fixture/device evidence, not logged-in Facebook-account verification.
3. Optimized compact black-box matrix: [run 41227360803](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41227360803). API 35 job 124614185225 and API 36 job 124614185649 SUCCESS with the isolated diagnostic implementation. API 29 and API 35 **debug** jobs failed; the whole matrix is not green and no blanket compatibility claim is made.
4. Dedicated API 36 isolated-surface repeat test: [run 41227916978](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41227916978), isolated job 124615849373 SUCCESS; three actual launches/settings-button/offline-paint repetitions with WebView 133.0.6943.137 (175.577s). The baseline arm failed **before exercising the diagnostic**, with launcher3 ANR holding window focus despite the app Activity being resumed. That arm is inconclusive, not an app crash or valid comparative control. An earlier isolated-arm launch failure was likewise not evidence of the native abort.
5. Previously, the original diagnostic did reproduce `Detected dangling raw_ptr in unretained` / SIGTRAP on Chrome_IOThread under WebView 133.0.6943.137 (run 41227360900, baseline job 124614186052). Removing `stopLoading()` alone also reproduced that native abort (run 41226733980, candidate job 124612336978); that approach was rejected. Original baseline also passed another three-repeat run, so the crash was intermittent. Isolation is an app-side mitigation for the observed diagnostic transition, **not a fix to the Chromium binary or proof that every native crash is impossible**. Memory safety checks were not disabled.

## Deliverable

[Compact APK artifact, about 1.1 MB](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41228090197/artifacts/13052198593).

Build run 41228090197 at production commit `a3607b6edb1d9cb74d92bc46c00ccd7e7ab3ad3a` passed DOM suites, debug unit tests, Android lint, and debug/compact assembly. Later commit f08e532 changes instrumentation only; its production source/build configuration matches this artifact exactly. GitHub downloads the artifact as a ZIP containing the compact APK; do not select the separate large debug artifact. PR remains unmerged.

Owner acceptance still needed: on the actual Android 13 phone/account, open several Reels cards (ordinary videos should remain normal), exit with Back, and confirm the viewer no longer remains white. Neither account access, all-device crash freedom, nor phone temperature/power improvement is established by the emulator results.
