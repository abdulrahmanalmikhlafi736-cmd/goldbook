# Build46 — do not leave a fixed empty Open App strip

Version `0.0.1`, versionCode46. Focused follow-up to45. User clarified that the
fixed dark strip disappears when Open App filtering stays OFF and returns when
it is re-enabled. The earlier interpretation (persists with filtering OFF) was
incorrect. No authenticated account DOM or physical-device reproduction is
available; this correction targets a matching, reproducible code failure.

## Failure demonstrated

Build45 hid a semantic CTA but kept its parent. A compact fixed bar can retain
its black background and min-height after that button disappears. The full
screen/modal guard did not cover small footer banners. The new regression
fails against actual build45 assets (`fb22680`): banner display remains `flex`
when it must be `none`. It passes against46 in standalone, reference-loaded/OFF
and reference-ON modes.

## Narrow surface policy

A fixed/absolute ancestor can become the hide target only when all apply:

- At least65% viewport width; positive height no more than160 CSS px AND25% of
  viewport height, including explicit height/min-height constraints.
- Contains at least one short, exact semantic app CTA. At most three descendant
  semantic controls, all app CTAs or recognized Close/Not Now controls.
- No unrelated text other than an exact app-prompt phrase, no media/photo,
  input, form, header/navigation, post/feed/main or dialog/modal content.
- All further positioned ancestors pass existing protection checks. An unknown
  compact full-width fixed surface is left usable, including its CTA; do not hide just its
  button and recreate an empty strip. Large/ambiguous sheets remain protected.

The whole verified bar is hidden so its background, min-height and pseudo
painting leave with it. No body-scroll changes, automatic Close clicks, scrim
removal, viewport cropping or forced native bottom padding. This does not
collapse arbitrary ancestors or remove a site-owned reserved spacer by guess.
Unknown prompts can remain visible deliberately. Narrow non-blocking toolbars
retain individual CTA filtering while preserving their Search/account actions.

Ownership moves atomically between a recycled inline CTA and its verified
surface; its child must not stay independently hidden. Original display value
and priority are restored when disabled, content changes or a dialog appears.
A WeakMap remembers verified geometry while our display:none removes the box;
it does not retain detached nodes. Existing frame-batched geometry and bounded
pending sets remain; no new observer/polling or mutation-microtask layout.

## Verification

Production app source: `066f73457f5afbc812c829e4a2958a35b856fdb2`.

- Six local DOM suites PASS; asset syntax and diff checks PASS.
- New `test-app-banners46.cjs`: before/after45 reproduction, whole-bar removal,
  no separately hidden child, stable rescans, exact disable restoration,
  inline-to-fixed ownership transfer, and media/photo/input/unknown text/action,
  post, oversized and modal preservation across all three engine modes.
- Native `AppPromptRegressionTest` now requires **11 assertions in each mode**:
  existing eight protections plus whole compact bar hidden, child not hidden
  independently, and exact/usable restoration when filtering is disabled.


### CI on the final app source

- [Build/Lint/JVM/six DOM suites and both APK variants](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40458931543): PASS.
- [Android13 focused gate](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40458931328): all four native tests PASS, no skips; the prompt test requires all11 checks in both reference modes.
- [Full device matrix](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40458931424): **1/4**. Compact API35 PASS, including anonymous Facebook/login focus with filtering ON. Debug29/35 fail only the existing real-tap video prerequisite in `zzPictureInPictureUsesRealPlaybackAndHome`. Compact36 fails `localPagePaintsThroughRealSettingsButton` because local HTML was not accessible; no assertion was weakened or failure counted green. The narrow-toolbar video-overlay regression passes after retaining its original CTA-hidden/Search-visible assertions.
- [Exact API35 device-tested compact APK46](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40458931424/artifacts/12714165021).

The initial46 pass over-protected a narrow fixed toolbar and failed its existing
CTA-hidden assertion. The final policy distinguishes narrow, short, non-media
toolbars from full-width strips; the original native assertion is unchanged.
This is not a fully green general matrix or proof of PiP/audio on the phone.

Production Kotlin, Manifest, page-info.js, Copy, website-native refresh,
video/PiP/audio and build44 lifecycle code are byte-identical to45. No data,
cookies or account state clearing. A matching reproduced layout is not proof
that every dark strip on the user's account is cured; real confirmation remains
with the Note20 test.
