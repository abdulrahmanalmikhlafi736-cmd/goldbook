# FPRO 2.18.46 baseline memory/resource audit

## Scope and reproducibility

Production application reconstructed from faceboost-review pin `fe8a474b25414b38819b7cf927720899c8c89705` with `integrations/faceboost-2.18.46/apply.py`. No application behavior modified by this audit.

Run:

```sh
npm install --prefix .cache/audit-harness jsdom@26.1.0
JSDOM_PATH="$PWD/.cache/audit-harness/node_modules/jsdom" node --expose-gc tools/audits/memory46.cjs PROJECT_ROOT > docs/MEMORY-21846-FIXTURE.json
```

The harness adds test-only counters to the loaded site-engine report, not the packaged file. Three fresh jsdom documents: color OFF, color ON, color ON + AMOLED. Each performs 30 cycles of feed -> post -> feed -> story -> feed, 150 route changes/scenario, 450 total. Each route replaces an eight-element panel. Test text has explicit Facebook blue foreground/dark background, exercising real production recolor writes. These are synthetic routes/content, NOT logged-in Facebook. Only site-engine is executed, not full facebook.js/native raw bundle/audio/Android.

## Reproduced retention

| Scenario | detached journal elements after cycle 1 | after cycle 30 | factory observers at end | factory timers |
|---|---:|---:|---:|---:|
| color OFF | 0 | 0 | 0 | 0 |
| color ON | 32 | 1192 | 1 | 0 |
| color ON + AMOLED | 32 | 1192 | 2 | 0 |

Total journal element entries with color ON grew from 40 to 1200 (eight still connected). The local `attrs` Map strongly retains detached elements for the active scope. Inspection of `scope/journal/stop` agrees: entries are cleared at stop, not when elements leave the document. This is a reproduced unbounded-over-session retention pattern for an active scope, not an estimated Android MB count. Repeated same-scope navigation does not call stop, intentionally preserving scroll behavior.

Additional detached references in `children` exist (2 color-only / 8 with AMOLED in this fixture), but did NOT grow across cycles here. Do not describe those as a measured growing leak.

All scenarios: re-evaluating guarded site-engine installed no additional live observers; no engine errors. After enhance OFF active scope is absent and only one singleton body-replacement host observer remains. Disabled scope journal counters cannot be directly inspected after release; collection of the old scope was not proven with heap snapshots.

JSON includes forced-GC Node heap samples. These are Node+jsdom heaps, not Android application or renderer PSS/RSS; do not use their slope as a device leak conclusion.

## Source review: additional resources

- `site-engine.js`: factory observers/timers tracked and disconnected/cleared in stop; singleton host observer remains by design. Whole-document color scans on style mutations may cause CPU work. Original raw Material You/AMOLED scripts can also be enabled separately: duplication remains a separate risk.
- `facebook.js`: strong video/paint/hidden ownership collections; source contains disposal/restoration/pruning paths. Presence of cleanup is not proof that every path executes. Old color paths are disabled by legacyConfig in upstream mode. Full engine retention was NOT dynamically measured here.
- `media-surface.js`: entry.dispose unobserves video, removes video event handlers and overlay/track, deletes Map entry, clears primary. Global viewport/document listeners are document-lifetime. Detached video cleanup occurs in layout. No repeated-create stress test performed here.
- `official-download.js`: bounded 8-second transaction; cancellation removes transaction listeners, disconnects observer and clears timer/frame. Short success veil and receipt tail is intentional. Prior 83-test gate includes timeout/cancel/idle cleanup; not an Android heap test.
- `HomeSwipeGuard.kt`: document-start ScriptHandler tag registration removes prior handle on reinstall, limiting duplicate registration.
- `ClipboardBridge.kt`: WeakReference to WebView; avoids one direct strong-reference path. Does not certify all bridge lifetimes.
- `LocalImageSaver.kt`: shared worker executor, strong per-instance WebView, session buffer capped at 8 MiB, blob timeout 15 seconds; clear removes timeout/buffer. Worker/UI callbacks can retain the saver/WebView temporarily. No explicit close/dispose to cancel pending work or remove the web-message listener/document-start registration was found in this class. Activity recreation/image-save instrumentation is needed; permanent leak not proven.
- `ImageDownloads.kt`: saver/listener installed in main WebView onCreated. Need verify WebView destruction and cancellation interaction under activity recreation.
- Main `MaterialbookWV.kt`: fullscreen DisposableEffect hides fullscreen, main WebView disposal delegates to external compose-webview lifecycle (not established from app call site). MessagesLayer explicitly destroys its WebView. Do not infer missing main destroy solely from this file.
- `MainActivity.kt`: onDestroy unregisters screen/PiP receivers and removes handoff timeout.
- `AudioPlaybackService.kt`: onDestroy removes Handler callbacks. Service teardown present. LockScreenAudioService has onDestroy; continued playback/service lifetime can be intentional and must not be counted as a leak without scenario checks.
- `StoryDownloads.kt`: system DownloadManager enqueue only on request; continuing system download is intentional, not an app-owned background scan.

## Not yet completed / required before device-level certification

No adb/Android SDK/emulator is installed in this sandbox. This turn did NOT run Android instrumentation, WebView heap snapshots, Activity recreation profiling, renderer PSS, or an authenticated Facebook account flow. Existing successful APK build is not memory evidence. No claim of zero leaks, comprehensive 100% runtime certification, or fix for Like-long-press/pull-to-refresh.

Next device gate: Android 13 real Chromium WebView; test ON/OFF and raw Material You/AMOLED combinations; same repeated user flow; measure app + renderer separately after idle/GC; inspect detached DOM retaining paths and destroyed Activity/WebView instances; include image save in-flight, repeated fullscreen/PiP, background/resume and activity recreation. Establish baseline before changing code, then re-run after narrowly scoped journal pruning and ownership de-duplication. Do not prune connected style/rule owners or undo history blindly.
