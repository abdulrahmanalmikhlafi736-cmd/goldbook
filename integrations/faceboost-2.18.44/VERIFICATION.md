# Verified 2.18.44 native WebView navigation entry

Final commit:e3d53a94c589d2ee70ab12eed149d0fbece289e2 (production source3baf5f5, fixture-only correctione3d53a9).
CI:https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42692528506
All3 jobs SUCCESS. Fresh328 Node cases PASS; exact `OK (63 tests)` Android13 gate PASS, retaining62 previous cases. Final local fresh apply also328 PASS. No gate/test/assertion removed or weakened.

- APK:https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42692528506/artifacts/13707209882
- Native evidence:https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42692528506/artifacts/13708701518
- Build inputs/full FPRO-2.18.44-source.tar.gz:https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42692528506/artifacts/13707938633

GitHub status/artifact metadata verified via API. No independent local APK signature extraction claimed. No PR merge performed.

## Evidence boundary

Owner43 screenshot Most plus scanned0/reason2 shows recorded sessions canceled before invoking post button discovery; it does not establish that43 matching itself failed. New generic trace is swipe result6/tap2, not correlated opener evidence. Actual transition URL/timing remains undisclosed.44 adds a native committed-navigation trigger to remove reliance on recognizing a post/comment click, not a guarantee of all routes/account behavior.

Read actual compose-webview2.0.3 source: doUpdateVisitedHistory updates navigator back/forward but not lastLoadedUrl, so a Compose effect on that state alone misses SPA history commits. Existing remembered BlockingWebViewClient now forwards native visited-history and page-finished signals after its original super callbacks. No client replacement, interceptor mutation, history patch or synthetic site event. Native per-WebView enabled map/HTTPS-Facebook gate and JS same-origin/actual canonical post identity guard constrain signals. Duplicate phases do not restart; active same-post choice verification is preserved. Finished event can recover an expired loading window once. OFF resets and cancels; other/off WebViews do not bootstrap.

## Regression evidence

Five new controller tests plus native-wiring test cover unrecognized entry followed by native commit, expired loading/finished recovery, duplicate phase refusal, pending-choice preservation, foreign/mismatched/invalid/OFF guards and return. Three positives fail43 (absent native method treated as no-op) and pass44.

New Android case cancels initial opportunity, performs actual Chromium history.pushState without an anchor, comment/sort tap, synthetic popstate or direct helper call, and waits for the actual WebViewClient history callback. Harness forwards that real callback through the PRODUCTION BlockingWebViewClient, initialized with real library state/navigator, then requires nativeStarts/phase1 and exactly one opaque opener/All/OK. No test/manual sort-button click. Controlled DOM/geometry is not authenticated owner Facebook or hardware input.

Initial run42690956217 failed Android-test compilation due to library internal state/navigator setters. Corrected fixture-only setup using reflection to initialize those backing fields (as Compose normally does internally); production visibility/behavior untouched. Final full63 gate then passed, without dropping callback or full-flow assertions.

## Preservation

Fresh43→44 comparison:9 changed generated paths for version, fixture, controller/diagnostic/formatter/native helper and existing client hook.23 critical paths byte-identical. Original BlockingWebViewClient request interception methods byte-identical after the new lifecycle overrides; original super/navigation calls retained. Media surface identical except version header. Centered2px progress/4px bottom/14px emoji/18px box/32px touch/unchanged length; images/download/Story/Seal/clipboard/hold/footer/audio/identity/signing retained. Independent default-OFF toggle and43 strict opener/text/radio/checked-state/OK safety gates unchanged.

Native counters nativeSeen<=32/nativeStarts<=8/nativePhase0–2 are telemetry caps, not a lifetime-start limit. Internal URL identities never exported. No polling, idle observer, network or disk storage added. Same8sec24-pass bound per finite opportunity, with at most history/finished opportunities per entry. Actual owner automatic success still unconfirmed; test normal post entry with option ON without touching sort.
