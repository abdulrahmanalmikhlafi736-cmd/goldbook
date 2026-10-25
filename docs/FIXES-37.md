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
  scroll. CI pending.
- Android build/lint/JVM and full matrix: pending. Live Facebook account rotation
  still needs owner confirmation; no universal ban on website-initiated refresh.

Compose reference: https://developer.android.com/develop/ui/compose/documentation?hl=ar
