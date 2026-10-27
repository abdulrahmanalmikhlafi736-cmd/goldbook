# Build53 — coalesced before-paint handling, including delayed page delivery

Version0.0.1 / versionCode53. Owner confirmed52 hides the real CTA, but still saw
a brief appearance. Preserve that success: isAppPrompt/appPromptText/
appNavigationSurface/navigationCaption/safeAppPromptTarget are BYTE-IDENTICAL to
owner-confirmed52 in BOTH engines. No new label exception or broad CSS hiding.

## Changes

- Previously only one candidate got urgent full validation; remaining candidates
  waited for RAF. A new target arriving DURING a site RAF callback could otherwise
  wait for another frame. Now one coalesced Promise microtask checkpoint drains
  the pending bounded48-candidate Set before returning to rendering. The existing
  RAF resets the allowance and drains any further queued work; no new observer,
  interval, perpetual RAF loop, network fetch or timer is added to production.
- The checkpoint computes ALL target decisions before applying ANY hiding writes.
  This avoids alternating geometry-read/display-write for every remaining CTA.
  It revalidates known targets too: skipping them caused the existing46 ownership-
  promotion regression to fail during development. That skip was removed and the
  UNCHANGED46 suite now PASSes. Whole-bar/child ownership remains atomic.
- A changed/added Search/profile/back sibling can supply navigation evidence after
  the CTA was inserted. Up to24 touched semantic controls, at most3 parent levels,
  yield at most4 verified navigation roots for the existing bounded prompt-only
  path. No subtree recoloring. Existing CTA is revisited when its eligibility
  changes; it need not wait for its own text mutation or the debounced full scan.
- OFF/master disable/engine switches clear pending work. Empty stale checkpoint
  callbacks cannot consume the next allowance. Detached targets are ignored.
- Timing report adds numeric prepaint.{batches,checks,hidden,maxMs} inside each
  existing engine timing result. Counts are cumulative and maxMs measures this
  checkpoint only, NOT the whole frame/FPS. No text/account data or auto upload.

## Explicit performance/design trade-off

This intentionally replaces the old "one immediate geometry validation, all
others RAF" limit. There is still only ONE urgent validation, but the checkpoint
may validate up to48 queued candidates in a grouped read phase. A single candidate
may get two reads (urgent + ownership revalidation);10 eligible controls get11
reads total, before returning to paint, not one.45/47/injection/49 assertions were
explicitly updated to reflect this; ordinary Search/color/badge work must still
cause ZERO geometry. The independent53 suite verifies read-before-write ordering.
Only one checkpoint is allowed until the existing RAF reset. Known rejection
cache still suppresses repeated urgent checks, but checkpoint revalidation can
occur once per rendering batch. This is not a zero-cost or layout-free claim.

## What slow-network tests actually establish

Hiding uses local bundled code and does not wait for a network request. New53
local tests simulate delayed DOM delivery three times, inserting10 eligible CTAs
DURING RAF, and assert ALL hidden at the microtask checkpoint before next RAF.
Actual52 assets FAIL that test. Tests also cover late navigation-label hydration,
OFF/re-enable and page/media/Search preservation in all three engine modes.

Native Chromium retains all22 previous checks and adds2 after900ms delayed DOM
insertion DURING RAF: all10 CTA candidates hidden before another frame callback,
with main/body retained.24 checks per reference mode. Test-only bounded result
polling awaits the asynchronous fixture; it is NOT shipped production polling.

These are delayed-delivery/render-checkpoint tests, NOT real throttled cellular
network tests, pixel capture of every compositor frame, or authenticated account
proof. No claim of universal "zero flash even on the weakest network": before
early script installation, beyond bounded discovery, unsupported/unknown markup
or while navigation evidence is not yet sufficient, safe classification may not
be possible. The partial-hydration test intentionally keeps an unverified control
visible until its navigation evidence exists. We do NOT hide body/header/video,
blank the WebView, pre-hide arbitrary aria-labeled controls or weaken modal/form
protection just to manufacture a zero-flash claim.

All13 local suites and JS syntax/diff checks PASS. Production Kotlin/Manifest/
early-start, native selection, Copy, website refresh, video/audio/PiP are unchanged.
Preserve46 black-strip repair and52 exact accessible-caption policy. Account
confirmation remains required; never uninstall/reset sign-in data on mismatch.

## Exact CI — a23a42d171b68635090a204c0ab26083faa1328b

- APK/unit/lint and all13 DOM suites PASS:
  https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40567373582
- Focused Android13 all4 required cases PASS, no missing/skipped cases:
  https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40567373596
  Prompt case requires24 assertions per reference mode, including delayed
  ten-candidate frame-callback insertion. XML gate rejects missing/skipped cases.
- Wider matrix **2/4 jobs PASS**, not all-green:
  https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40567373660
  Compact API35/36 PASS. Debug API35 fails real-tap playback prerequisite for
  PiP; debug API29 fails that plus playbackReportingTracksPageOnEveryProvider.
  Causes unestablished, not dismissed as infrastructure/noise.
- Hand-off is the actual compact API35 device-verified APK:
  https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40567373660/artifacts/12762939279

Clean full source includes wrapper/test media, not historical APKs/archives,
build directories, dependencies, caches or credentials. SHA256 is adjacent.
No production signing key. PR stays open/unmerged; no merge authorization.
