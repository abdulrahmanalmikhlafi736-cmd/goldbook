# Build65 — scoped material-color processing during video playback

## Scope

Owner authorized fixing the measured video workload and continuing improvements
with evidence, not speculative wholesale rewrites. This build removes a proven
source of unrelated color processing; it does NOT claim a measured reduction in
physical phone temperature or that all video power consumption is fixed.

Production commit: `76e56bbd774e3b07a535bd2de406a987e4957de8`. Later commit463bae1
changes only the Android test's startup wait/diagnostics; app sources and Gradle
configuration are byte-identical. Version65/name0.0.1.

## Implementation

The pinned upstream `material_you.js` remains byte-identical. A checked generator
adaptation (`tools/scope-material-color.cjs`) changes only the material-color
factory in the generated `site-engine.js`:

- Initial mount still processes the existing page once.
- Own FPRO video controls/styles are excluded, without disabling the observer or
  the color feature. No synthetic site events, input interception or timers added.
- Existing inline-style changes inspect only their target. New DOM subtrees scan
  themselves, not the document. Overlapping changed roots are deduplicated by
  walking ancestors, not an all-pairs root comparison; no batch roots are dropped.
- Ordinary clock text changes require no recoloring. Style-element text and
  character-data changes still recolor. A WeakMap tracks the latest processed CSS
  text instead of permanently skipping reused style elements.
- Existing lifecycle journaling restores the site's latest styles when switched
  OFF. Existing theme classifiers and palette rules are retained.

The confirmed `app-prompt-engine.js`, `facebook.js`, feed-return helper and native
main sources are unchanged. Selection/comment behavior, background sound, PiP,
ball animation, seeking, downloads and fullscreen are not redesigned. Feed-return
is still owner-reported unresolved. Comment-copy work remains deferred.

## Local verification

**24 DOM suites PASS**, Node24.22.1/jsdom29.1.1; generator `--check` and diff-check
PASS. The new regression fails against build64 with104 queries vs expected0,
then passes against65. It covers progress/clock churn, target-only changes, nested
new nodes, reused/character-data CSS,48 simultaneous roots and OFF restoration,
including the latest site stylesheet edit.

Full combined-script audit,120 styled cards,12 simulated updates250ms apart:

| Scenario | Build64 queries / returned matches | Build65 queries / returned matches |
| --- | ---: | ---: |
| Gold + FPRO progress | 96 /1488 | **0 /0** |
| Gold + site's clock text | 144 /1740 | **32 /4** |
| Natural color + site's clock | 32 /4 | 32 /4 |
| Idle | 0 /0 | 0 /0 |

Returned matches include repeated results, not distinct nodes. Gold/site-clock
still has two main-engine scans: this build does not claim zero total page work.
The color observer still receives mutation deliveries; it exits without a color
search for irrelevant changes. Evidence: `VIDEO-WORKLOAD-65-COUNTS.json` and the
previous64 report/counts. These synthetic counts are not CPU or heat percentages.

## Actual Android13 playback verification

**PASS** run41221135422 (production76e56bb):135 decoded frames,22 timeupdate and22
site-clock updates;0 target/document color queries; no site-engine errors.

**PASS** run41221443246 (test463bae1):**170 decoded frames**,28 timeupdate and29
site-clock updates;**0 target/document color queries**, no site-engine errors.
The second run permits up to8 seconds for playback startup and reports decoder
state on failure; the first earlier run41221066309 failed a fixed2-second startup
assertion; its precise decoder state was not captured. Do not omit this earlier
failure or treat it as a thermal result.

The test runs the actual combined production assets in a real WebView, plays a
real generated H264/AVC baseline MP4 and checks decoded frames, rather than
mocking `timeupdate` or media state. It also verifies existing/new site colors
still change and OFF restores them. The clip is49,271 bytes under androidTest
assets, NOT packaged into the compact APK. The measurement has a5-second test
sleep plus bridge/scheduler overhead, not a precisely controlled energy window.

- [Final native run](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41221443246)
- Evidence: `VIDEO-WORKLOAD-65-ANDROID.json`.
- APK/unit/lint PASS41221135614; web compatibility PASS41221139700.
- Prompt workload PASS41221066322. Broader Android13 upgrade41221443312 is
  **8PASS/1FAIL**, only the already-deferred opaque-comment selection assertion;
  first-frame prompt hiding, native palette/layout, trusted footer transitions,
  controls and playback reporting pass.
- Exact compact API35 checks **PASS** job124595744078 of41221135403, including
  actual-package UI tests. API36 in that run failed opening the compact app;
  API29 debug also failed. The full matrix is NOT green; API36 startup needs a
  separate investigation, and is not proven caused by this color change.

## Delivery

[Compact65 APK ZIP (~1.08MB)](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41221135403/artifacts/13049658001)

GitHub metadata: artifact13049658001,1,076,905 ZIP bytes, uploaded only after
successful compact API35 checks. No merge or release publication performed.

## Remaining limits and next investigations

Physical device thermals, renderer/codec CPU, GPU/compositor costs, adaptive
network bitrate and battery drain have NOT been measured. A small looping test
clip is not a signed-in Facebook long video or the owner's phone. Actual heat
improvement needs owner use/measurement; no percentage savings is claimed.

Investigate independently rather than mixing unrelated changes: video rendering
and hidden-player behavior, periodic header/checkpoint work, API36 startup, and
the still-unresolved feed-return report. Keep the confirmed prompt/touch behavior
and explicit comment-selection deferral intact. Compose UI unchanged; project UI
reference remains https://developer.android.com/develop/ui/compose/documentation?hl=ar .
