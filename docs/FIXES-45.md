# Build45 — conservative Open App filtering

Application version remains `0.0.1`; versionCode is `45`. Production Kotlin,
Manifest, page-info.js, WebKit 1.16.0 and all build44 lifecycle changes are
unchanged. This is a focused correction to the two existing JavaScript filters,
not a replacement browser, refresh controller or media implementation.

## Why change it

The user reports intermittent or persistent black screens when Open App hiding
is enabled, while build44 otherwise works well. Inspection found ancestor
climbing (up to eight levels) and overlapping display ownership between the
main and reference filters. These can remove much more than the CTA itself or
restore a stale hidden value. This is a concrete code risk, **not proof of the
exact cause on the user's authenticated page**.

## New policy

- Recognize only short, complete, explicit CTA labels. A Facebook brand label,
  a URL alone, a prefix match or a paragraph mentioning the app is insufficient.
- Hide only the semantic leaf button/link, never its parent or an inferred
  banner. Exclude forms, roots, media, nested interactive controls and oversized
  controls. Header/account/search/close controls remain untouched.
- Preserve CTAs in dialogs and fixed/absolute blocking sheets. A promotional
  video does not make such a sheet safe to edit. It is better to leave a usable
  prompt visible than remove its CTA while leaving a black backdrop or scroll
  lock. No automatic Close clicks, backdrop removal or body-scroll unlocking.
- Use the same target policy in both engines. When the reference filter is ON
  it alone owns display changes; otherwise the main filter alone owns them.
- Restore owned display values (including priority) when a recycled control no
  longer matches, moves into a protected sheet, or the option is disabled.
- MutationObserver work performs structural checks only. Geometry checks run
  in a coalesced requestAnimationFrame with a bounded pending set of 48 nodes;
  disabling cancels pending callbacks. No new observer or polling timer.

An entire empty banner slot is deliberately not hidden by inference. A normal
empty wrapper can collapse naturally. Some modal Open App prompts will remain
visible by design. Removing arbitrary site dialogs is outside this fix.

## Verification

Production assets: `a25298a5a97d8b46e3b88d50950f3aed52c35d69`; unchanged
through `31d9d7e` and `dbd0321` (native/black-box test refinements only).

- Five local DOM suites PASS: injection, browsing, interaction, selection43 and
  app-prompts45. Asset syntax checks and `git diff --check` PASS.
- `test-app-prompts45.cjs` exercises standalone filtering, reference asset loaded
  but OFF, and reference ON. It checks identical policy source, single ownership,
  modal/fullscreen/promo-video safety, recycled labels, stable style writes,
  display priority restoration and no geometry reads in mutation microtasks.
- [Build / lint / JVM / five DOM suites / debug and compact APKs](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40455280646): PASS.
- [Android13 focused native gate](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40455113575): all **four tests PASS, no skips**. Real Chromium fixture covers the new CTA policy with reference OFF/ON; the three build44 recovery, origin/frame bridge and playback-reporting tests also PASS. The recovery test simulates the callback contract, not an OS memory kill.

- [Full device matrix](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40455280639): **2/4**. Compact API35 and36 PASS, including real anonymous login input focus with filtering ON. Debug API29 and35 fail only the existing real-tap playback prerequisite in `zzPictureInPictureUsesRealPlaybackAndHome`; no PiP assertion was disabled. This is not a fully green matrix or PiP/audio proof.
- Published APK: [exact compact API35 device-tested artifact](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40455280639/artifacts/12712341818), app source `dbd0321`. The native focused test source is identical to the passing Android13 gate at `31d9d7e`.

No authenticated Facebook/Note20 reproduction has been performed. These tests
verify the safer filtering contract, not that all black screens or all
PiP/audio behavior on the user's account have been solved. No login/cookie/cache
clearing, synthetic site refresh or changes to native Copy have been added.

### Test-fixture corrections (not production workarounds)

The original native sheet fixture used CSS `inset`, unsupported by the stock
API29 Chromium. It now uses all four longhands so it really covers the screen
on that provider. `loadDataWithBaseURL` also timed out in one Android13 run;
the fixture now uses the same deterministic intercepted HTTPS navigation as
the existing build44 bridge tests. All eight assertions per reference mode
remain required, including both modal and CSS-only sheet CTA visibility.

The older compact test required every occurrence of the public site's install
marketing phrase to disappear. That contradicts this deliberately conservative
policy (protected forms/sheets and prose may remain). It now requires the
original blue login button, account navigation and actual input focus while
filtering is ON. Safe inline CTA hiding is separately mandatory in the native
fixture and all three DOM engine modes. Do not infer from these anonymous
login checks that the filter was tested on an authenticated account.
