# Build36 — initial paint and private browsing-position checkpoints

The owner confirmed build35's seek-track result is now correct. Its player
geometry, gray-wrapper replacement, ball, selection23 and download code are
unchanged. New scope: a temporary white first-load surface and losing place after
leaving the app for 2–10 minutes.

## What the code actually showed

- Startup hid the splash after a fixed 600ms, regardless of content or compositor
  readiness. The supplied screenshot still has the native load progress bar.
  This is evidence of a loading surface, not proof of a specific network failure.
- `onResume` already did NOT reload. Do not invent or "fix" a nonexistent reload.
- History was saved only to Android's instance-state Bundle, with no app-private
  cold-start checkpoint or explicit window/nested-scroll/anchor recovery. Android
  process removal and website refresh can therefore lose the position.

## Changes

- First reveal requires visible meaningful elements and a WebView compositor
  frame (`postVisualStateCallback`, Android6+), not a fixed 600ms delay. The existing
  FPRO loading view stays while the initial website loads; no screenshot/fake feed
  is substituted. Connection errors or a 25s timeout reveal an actionable retry
  message. No automatic retry/reload is added.
- Keep the same WebView and document on warm resume. Capture position before
  pausing and every 15s while the page has focus. On resume only attempt recovery
  if position was actually lost; real touch/wheel/keyboard input cancels it.
- Default-on **حفظ آخر موضع للتصفح لمدة تصل إلى 24 ساعة** keeps a bounded private
  checkpoint: WebView history, current first-party URL, window scroll, up to four
  inner scrollers, and an optional visible article permalink plus pixel offset.
  It stores no post text, screenshots, cookies copied by our scripts, passwords,
  input values or media download URLs. Chromium's own history Bundle is private.
- Atomic app-internal file, max2MiB; no external storage, backup or upload. Writes
  run off the main thread. Invalid, corrupt, future-dated or >24h-old checkpoints
  fall back safely. Login/logout/checkpoint routes and password forms clear the
  checkpoint; turning the setting off clears it too.
- Cold start restores saved history and then tries the saved URL/position. Lazy
  content gets a bounded 20s recovery window. No Activity/WebView static leak,
  artificial keepalive service, foreground notification or battery exemption.

## Limits / honesty

A normal background return can preserve the actual live page. After Android kills
its process, WebView history is NOT a serialized DOM. Facebook may return a new
feed order or delete/unload the original post, so exact cold-start placement is
best effort, not a guarantee of preserving every virtualized post/video state.
No claim that hiding the temporary white load surface fixes Facebook networking.

## Verification

- Local existing DOM suite and new browsing regressions: passed.
- New DOM cases: window/inner-scroller/anchor capture, no private text/form values,
  password exclusion, gesture cancellation, URL isolation, visible-content first
  paint and no load/reload in onResume.
- New Android tests: real Chromium scroll recovery and same-document warm resume;
  private history round-trip after simulated10minutes, 24h expiry, future clock,
  forbidden routes, corrupt file and clear. CI pending.
- Build/lint/JVM and full device matrix: CI pending. Tests do not authenticate an
  account and do not simulate an actual10minute OS process eviction.

Compose reference: https://developer.android.com/develop/ui/compose/documentation?hl=ar
