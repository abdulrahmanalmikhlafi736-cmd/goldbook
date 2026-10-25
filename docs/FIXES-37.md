# Build37 — rotation must resize, not restart browsing

The owner confirmed build36 entry/position recovery, but reports a refresh when
turning the phone from portrait to landscape. No runtime trace yet proves whether
this is Activity recreation, native bootstrap repetition or Facebook's own
responsive navigation. This change removes two app-side risks and expands native
configuration coverage without claiming that a fixture proves the live account.

- Move initial history restore/navigation out of `LaunchedEffect(Unit)` into the
  Activity's one-time WebView setup. Reattaching/restarting Compose controls must
  never run browser bootstrap again.
- Native size publication no longer dispatches a synthetic global `resize` to
  Facebook in addition to Chromium's real resize. Publish a private
  `fproviewportchange` event only our tool layout handles. Normal responsive
  layout, genuine resize events and real landscape browsing remain enabled.
- Keep the same Activity/WebView through orientation/screen size changes and
  accompanying density, keyboard, uiMode and layoutDirection changes. No forced
  portrait, frozen viewport width, reload or new background service.
- No seek geometry, emoji, native selection, download or build36 checkpoint/entry
  algorithm changes. Existing actual viewport updates still reach the player.

## Verification

- Local syntax, DOM and browsing regressions: PASS, including native bootstrap
  outside Compose and no native synthetic global resize.
- Extend the real WebView browsing lifecycle test with actual portrait→landscape
  →portrait requests, waiting for measured orientation/size, checking Activity and
  WebView identity, same JS document token, unchanged history and window/nested
  scroll: **PASS on API29 and API35**, confirmed by
  [XML inspection 40239014871](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40239014871).
- Android build/lint/JVM and both DOM suites: [PASS 40238360458](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40238360458).
- Full device matrix [40238360655](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40238360655): **3/4**.
  API29 debug, API35 compact and API36 compact PASS. API35 debug still fails the
  existing real-tap playback prerequisite in the PiP test; not counted as a pass.
- Build36 private history/10minute retention and build35 native track/ball/gray
  surface tests remain PASS on API29 and API35 in this run.
- [Exact API35 device-tested APK](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40238360655/artifacts/12616225247),
  ZIP 1,012,502 bytes; application/test source `b394af5a7c683ab1fd3ef05fa01b9e6a90a24cf2`.
- [Clean complete build37 project source](../downloads/FPRO-build37-source.zip).
- Live Facebook account rotation still needs owner confirmation. The native
  fixture proves real Activity/WebView/document continuity during rotation, not
  a universal ban on website-initiated refresh.

Compose reference: https://developer.android.com/develop/ui/compose/documentation?hl=ar
