# FPRO 68 — source-post return and single-press Back

Date: 2026-11-01. Version code 68, version name 0.0.1.

## Owner report and reproduced defects

**Owner follow-up:** the return problem remains unresolved on the actual account. See `PROMPT-VIEWER-AUDIT-68.md` for the subsequent prompt-toggle investigation; fixture successes below are not owner acceptance.

The owner confirms both Android Back and Facebook's own arrow return to the wrong feed location and can feel delayed. Builds 63/64 were not accepted as solving this on the account. This change does not retroactively claim they did.

1. Native `smartBack` could consume Back by smoothly scrolling a detail page to its top whenever no recognised feed checkpoint existed. Baseline native run [41337411002](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41337411002) reproduced a failure to return with one real Back; its original source-anchor test still passed. That scroll-to-top interception was removed. Fullscreen/settings/dialog branches remain intact.
2. The return helper erased the checkpoint on a home-route replacement and required exact URL equality. A site Back arrow using `replaceState`, or a change to referral parameters, could therefore discard the source anchor. The new code recognises actual Back-labelled control activation and keeps a replacement checkpoint until the history event. Explicit Home pushes still do not restore. Only `ref`, `refid` and `mibextid` are ignored when comparing home URLs; feed filters, origin and hash remain significant. Root and `home.php` are recognised home aliases. History state and site events are not replaced/replayed.
3. Restoring an expanded post's deeply negative offset after it becomes short can move the correct source post entirely above the viewport, showing later cards. The DOM reproduction returned scrollY 3400 instead of 2100. The helper now retains the exact old offset when it still shows the source; if that offset would hide the entire source, it aligns the identified source post's own start. This is not a guessed number-of-posts or scrollY fallback. Missing/unknown anchors still do not trigger an invented offset.

No extra feed scans, timers or observers were added; the existing bounded settling and real-input cancellation remain. No changes were made to the build-67 fullscreen rotation guard, gesture engine, app-prompt hiding engine, site engine, themes, media workload or comment-selection policy.

## Verification

[Final Android 13 run 41338009826](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41338009826), source `255ee2b87e1e21bedb0b86b7a6734df6d27878f7`, job 124941850900: **all four native tests PASS**.

- Real Android Back on a scrolled detail page without a recognised checkpoint returns with one press: measured **138ms**.
- Real touch on a site Back arrow using route replacement and changed referral parameters returns the source post to **100px**: measured **42ms**.
- Original early-activation/rebuilt-wrapper/late-layout case: original, first-return-frame and settled post top all **100px**. Trusted user touch cancels settling.
- Expanded-to-collapsed source case: source top **0.190476px** (density rounding), visible rather than later cards. No relaxation of the identity requirement.

These timings describe this emulator and offline fixtures, not Facebook server performance or the owner's phone/account. Evidence is retained in `FEED-RETURN-68-ANDROID.json`.

All **26 DOM suites PASS** on Node 24.22.1 (`.cache/feed68-final-dom.log`, not distributed), including new site-arrow, referral change, root/home.php alias, different-filter rejection and collapsed-source regressions. Unit tests, Android lint, injected-page suites and debug/compact assembly passed [APK run 41338009813](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41338009813).

Video preservation: [run 41338481748](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41338481748), API 33 job 124943244027 and API 35 job 124943244281, both PASS for real double-tap/fullscreen/landscape/continued frames/single Back. Production matches the delivered APK. An earlier smoke run 41337770291 passed API 35 but failed the API 33 playing-state predicate; the follow-up added failure diagnostics only, with no media production changes or assertion relaxation. That intermittent result is retained rather than described as a media fix or universal guarantee.

## Deliverable

[Compact APK 68 ZIP, about 1.1 MB](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41338009813/artifacts/13095983352).

Built from 255ee2b. Subsequent instrumentation-only changes do not change production sources/build configuration. Do not choose the separate large debug artifact. PR remains open/unmerged.

## Limits

This fixes reproduced defects, not a verified trace of the logged-in account. Opaque posts without a usable identity, absent/virtualised anchors, unrecognised site Back labels and site layout mechanisms not represented by these fixtures can still require investigation. No all-provider/matrix-green, universal latency, temperature or all-future-errors guarantee is made. Broad historical audit/selection findings remain outside this fix.

Mandatory Compose reference: https://developer.android.com/develop/ui/compose/documentation?hl=ar . No Compose production changes were made.
