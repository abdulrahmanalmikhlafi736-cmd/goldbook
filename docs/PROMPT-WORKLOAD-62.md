# Build 62 — focused Open App prompt workload fix

## Scope and acceptance

The owner isolated the touch slowdown to the Open App/install hiding switch:
OFF is smooth, ON is heavy. This patch targets `app-prompt-engine.js`, not the
post/comment selection subsystem. Preserve build60's successful prompt hiding,
search/account controls and reversible OFF behavior. No synthetic site events,
no replacement refresh gesture, no imported-engine rewrite.

## Before editing production

- Added `PromptWorkAuditTest` and ran it on an Android13/API33 emulator against
  unchanged production assets. It uses Android trusted down/up input and a real
  WebView, but an anonymous synthetic page, NOT an authenticated Facebook account.
- Baseline run **41174596998** passed: ON reproduced >1000 returned DOM-query
  results for six batches of ancestor style writes, while the site button still
  received trusted input. This is a workload reproduction, not a latency SLA.
- New DOM regression failed on the original: **14400 returned results / 192
  querySelectorAll calls** for six 30-write batches on a 1200-card ancestor.

## Production changes

1. Deduplicate mutation roots before discovery; ancestor membership uses Set
   lookup along the parent chain rather than pairwise comparisons of siblings.
2. Attribute/text changes inspect the changed cue/semantic owner and revalidate
   affected owned prompts. They do not enumerate the ancestor's whole feed.
3. Added subtrees still undergo immediate synchronous discovery. One discovery
   selector replaces overlapping aria/generic scans; no arbitrary eight-root or
   800-match cutoff silently drops a late text-only CTA.
4. Discover home landmarks only during insertion/initial discovery or role/modal
   context changes, not every opacity/style/class change.
5. Already-ON config updates keep CSS/ownership without rescanning the document.
6. Revalidate known hidden controls when a parent gains fixed/sticky footer
   layout, preserving whole-footer hiding rather than leaving an empty strip.
7. Reinstall the owned guard stylesheet if the site removes it.

The label list, exact early CSS, protection rules, display priority and OFF
restoration remain unchanged. No timers, animation-frame queues, history patches,
or additional observers were introduced. There is no deferred old work to fire
following OFF. Version code becomes62; version name remains0.0.1.

## Paired DOM measurements

See `PROMPT-WORKLOAD-62-COUNTS.json`, produced by the unchanged existing audit.
Same fixtures/config/mutations, only the prompt implementation differs.

| Active scenario | Before queries | After queries | Before returned | After returned |
|---|---:|---:|---:|---:|
| 240 cards, six ancestor style updates | 18 | 0 | 2880 | 0 |
| 1000 cards, six ancestor style updates | 18 | 0 | 12000 | 0 |
| 240 cards, six batches x30 style writes | 192 | 0 | 2880 | 0 |
| All five assets,120 cards, same ancestor churn | 108 | 90 | 1500 | 60 |

The full-stack remainder belongs to other engines; it is NOT reported as zero
page work. Every arm retains ON hiding / OFF visibility and zero extra idle
passes. Re-showed owned inline-important footers are corrected without full
subtree scans.

## Verification and remaining limits

- All22 DOM regression suites pass on Node24.22.1/jsdom29.1.1.
- The new regression covers ancestor bursts, stable ON config updates, >8 added
  sibling roots, text-only CTA after3500 nodes, five inline-important re-shows,
  recycled Account/Search controls, forms/dialogs, reparenting, late footer
  promotion, detached ownership, OFF/no later work, and re-enable.
- Optimized Android13 run **41175586980 PASS**:600 cards, six batches x30
  ancestor style writes. OFF and ON both returned0 query results /0 candidate
  checks. Trusted pointer counts1->2 and site click counts1->2. ON prompt hidden,
  OFF visible; important re-show correction and final OFF restoration asserted.
  Raw evidence: `PROMPT-WORKLOAD-62-ANDROID.json`. Its elapsed/event timestamps
  are NOT a statistically valid latency comparison or frame-rate benchmark.
- Native Android13 broader regression **41175240916**:8 PASS/1 FAIL, matching
  baseline. First-frame prompt hiding/restoration, trusted fixed-page transitions,
  blocking-sheet/search protection, imported-engine layout and palette all PASS.
  The sole failure remains the pre-existing opaque-comment/native-copy test.
- Build **41175240930 PASS**:22 DOM suites, unit tests, lint, debug and compact
  APK compilation. Separate compatibility workflow **41175240955 PASS** on
  Ubuntu24.04 and26.04. APK production source is commit8c43e7b, identical to the
  production source in the final native test (subsequent changes are CI/docs).
- Baseline broader Android13 suite already had8 PASS/1 FAIL: the deferred opaque
  comment/native-copy test fails before this change. It is not fixed or hidden
  here. Baseline compact-device checks also have app-opening failures. These
  pre-existing failures prevent claiming all repository device checks are green.

This fix removes demonstrated redundant prompt discovery. It does not prove
zero input latency or all-account/no-flash behavior. New subtrees are deliberately
still scanned before paint: very large genuine insertions can take time. Early
CSS matching/layout work and Facebook's own tasks remain possible contributors.
The owner's Note20 Ultra/Android13 account comparison is still required.

## Evidence links

- Baseline native: https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41174596998
- Baseline broader Android13: https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41174591618
- New tests: `tools/test-prompt-workload.cjs`, `app/src/androidTest/java/com/almekhlafi/FPRO/PromptWorkAuditTest.kt`.

## Final build/test links

- Native optimized + JSON: https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41175586980
- Native broader: https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41175240916
- APK build: https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41175240930
- Debug APK ZIP: https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41175240930/artifacts/13032840857
- Compact APK ZIP (compiled, not claimed compact-device verified): https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41175240930/artifacts/13033250331
