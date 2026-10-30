# Build57 — guarded Materialbook/Nobook adaptation

Version0.0.1 / versionCode57, Android7+; native dynamic palette requires Android12+.
User explicitly chose adaptation/improvement of current FPRO engines rather than
wholesale replacement. Scope: Material You, AMOLED, DOM ad/section hiding, sticky
navigation and an additional guarded bottom-CTA discovery cue.

See [attribution, pinned source revisions, feature table and limits](UPSTREAM-ADAPTATIONS.md).
No unrelated native touch/refresh/selection/media rewrite; original12 colors,
search/account controls, site refresh, Seal, PiP and earlier dark-strip fix retained.
Settings descriptions now explain automatic + system colors, instead of saying
that automatic can never recolor. Named colors and natural keep priority;
automatic without dynamic/native palette retains the previous no-recolor fallback.

## Review corrections before delivery

An initial targeted fixture used natural color for AMOLED/sticky separately.
Review identified that normal accent reset would also undo their declarations
if all shared one map. Scope the existing ownership helper with a separate map
for adapted surfaces/offsets, restore/reclassify these on a full pass, and restore
on settings/master OFF. Added combined AMOLED+accent and repeated-scan checks,
and sticky+accent coverage. The native fixture enables all together and checks
real computed styles. No assertions were removed or weakened. The initial Android13 fixture independently reproduced the two failures (AMOLED and sticky offset) before the ownership correction; prior five cases passed. Initial evidence: run41088355759, check124175368195.

Tracked-container candidates now reject nested articles/FeedUnits/tracked cards,
form/modal and navigation content, rather than climbing into a wrapper that can
contain ordinary posts. Both verified upstream mobile Reels glyphs are recognized,
with independent reel-link evidence still required. Held-input/native-selection deferral also applies to the additional non-CTA fast work, without deferring footer discovery. A targeted held-pointer fixture checks deferred ads plus urgent metadata-only Arabic CTA. New hiding runs before the
existing retained-target cleanup so it is not immediately restored each full scan.

## Evidence / limitations

Local Node24.22.1: all17 discovered DOM suites PASS, including the new57 suite.
Final tested production/test source: `2b70cfbd8d88885b9e9c22cbc0220d559a80663f`.
Subsequent delivery changes are documentation/archive only.

- [Build/unit/lint/debug+compact APK/17 DOM suites: PASS](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41089014920).
- [Android13: all6 required cases PASS, none skipped/missing](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41089014897), check124177632880. New real-palette/combined-style fixture plus existing trusted-transition, prompt, renderer, playback-reporting and origin-bridge cases.
- [Node24.22.1 /17 suites on Ubuntu24.04 AND26.04: PASS](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41089014887).
- [Wider device matrix: FAIL, only1/4 jobs PASS](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41089014980). Compact API35 passes all black-box cases; exact tested APK artifact12993845660. Debug API29/check124177633722 and35/check124177633853 still fail the PiP real-tap playback prerequisite previously unresolved in56. Compact API36/check124177633573 fails all3 cases at “Actual compact app must open”; launch/UI-visibility failure is unresolved, NOT a successful rendering test. Prior44f4fdf run41088546847 passed compact35/36, but that does NOT override the final36 failure. Do not call the complete matrix green or label this conclusively environmental. Full remote log retrieval in this sandbox returned EOF; check annotations establish the failure, not its root cause.

Installable outputs exist, but passing compilation/targeted Android13 fixtures
is not all-device or private-account acceptance. No test expectations weakened,
failures hidden, automatic merge or data deletion.

The owner's account-specific CTA disappearance is NOT established. Existing56
controlled tests passed but the owner still reported visible CTA during interaction.
Build57 adds a discovery mechanism, not a promise of no initial/compositor flash.
Do not treat synthetic labels/fixtures as signed-in Facebook acceptance tests.
