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
Android compile/lint/APK and emulator outcomes are recorded below once available.

The owner's account-specific CTA disappearance is NOT established. Existing56
controlled tests passed but the owner still reported visible CTA during interaction.
Build57 adds a discovery mechanism, not a promise of no initial/compositor flash.
Do not treat synthetic labels/fixtures as signed-in Facebook acceptance tests.
