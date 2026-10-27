# Build47 — Reels header CTA and urgent filtering latency

Version `0.0.1`, versionCode47. User confirms46 eliminated the fixed dark strip;
keep that surface policy. Remaining request: Open App returns in video/Reels
navigation and hiding should be less noticeable.

## Changes

- Treat a short fixed/absolute real navigation row differently from a dedicated
  install strip: preserve the row, hide only its exact semantic Open App CTA.
- Structural navigation evidence: Search plus profile/account/back controls;
  semantic header/nav/banner/navigation/toolbar can qualify with Search. Require
  2–24 semantic controls, no form/media/post/feed/dialog content and positioned
  row height at most160 CSS px. Generic wrappers need both types of evidence.
  No guessing Facebook class names, URLs or arbitrary icon shapes.
- Existing form/modal/root/media/oversized protections take precedence. Dedicated
  full-width install bars still use46's whole-verified-surface rule; do not
  reintroduce child-only hiding inside an ambiguous full-width install strip.
- Urgent batch capacity48 now counts matching CTAs instead of unrelated controls.
  Previously ordinary controls could exhaust it and push the actual CTA into the
  debounced general scan. Existing traversal limits, RAF geometry, document-start
  injection and frame cancellation remain. The full reference scan still caps
  processing at800 candidates, not800 matches.
- No extra observer, polling, pending opacity/visibility tricks or forced layout
  in mutation microtasks. No timing benchmark or absolute zero-flash guarantee:
  site/provider scheduling, unsupported early-injection providers and fragments
  beyond the bounded traversal can still affect the first visible frame.

## Regression evidence

Production JS: `862ed6b6c2ae03304af1079581ff83f9a8eceb45`; byte-identical through
`0746e77` (test-only isolation refinement).

- Seven local DOM suites PASS, syntax/diff checks PASS.
- `test-app-reels47.cjs`: generic and semantic fixed navigation, CTA-only hiding,
  Search/account/media preservation, modal/disable restoration, all three engine
  modes and identical helper source.
- Isolated latency case inserts100 unrelated buttons before a plain inline CTA.
  It requires hiding in the first frame batch without waiting for a general scan
  and asserts no geometry reads in mutation microtasks.
- Both the navigation case AND the isolated latency case fail against actual46
  assets from `9c04c93`, and PASS against47. The isolated latency case does not
  depend on the new navigation classification.
- Native prompt fixture now requires13 assertions in each reference mode: all11
  from46 plus Reels CTA hidden and its real navigation/search/account retained.

Production Kotlin, Manifest, page-info.js and early-start.js are unchanged46.
Copy, website-native refresh, video/PiP/audio, download and fullscreen behavior
are not rewritten. No cookies/cache/login clearing. No authenticated account or
physical Note20 DOM reproduction; the screenshot identifies appearance, not its
actual DOM structure. User validation remains necessary.

## CI and download evidence

- [Build / Lint / JVM / seven DOM suites / debug and compact APKs](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40460350442): PASS at `0746e77`.
- [Android13 focused gate](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40460290109): all four tests PASS, no skips at `862ed6b`; the prompt fixture requires all13 assertions per reference mode.
- [Full device matrix](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40460290154): **2/4**. Compact35/36 PASS. Debug29/35 fail the existing real-tap playback prerequisite in `zzPictureInPictureUsesRealPlaybackAndHome`. Debug35 additionally fails `eStorySlotAndRasterPaletteActuallyRender`: ring0 pixel `ff242526` instead of red. Color code was not changed, but the pixel failure is NOT assumed harmless or counted green; its exact cause is unverified and no assertion was weakened.
- [Exact API35 device-tested compact APK47](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40460290154/artifacts/12713794872), app commit `862ed6b`.

These are not all-green device results or authenticated Facebook proof. The
scheduling test demonstrates removing a specific bounded-queue delay, not a
measured phone-wide speedup or a guarantee of imperceptible hiding everywhere.
