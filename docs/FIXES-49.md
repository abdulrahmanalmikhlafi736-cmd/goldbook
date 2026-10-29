# Build49 — bounded before-paint validation from the owner's timing report

Version0.0.1 / versionCode49. Follow-up to a real48 report, not a claim that48
was account-proven. Production source `f0327c7`; native17-check fixture includes synthetic
timing/classification details for failures.

## What the report establishes (and what it does not)

The supplied snapshot says appCode48, early=true, both enhancement/filter flags
true and reference enabled. Its fixed DIV owns the reference hide marker and is
display:none; its nested role=button passes structural checks and resolves to a
surface target. Parent feed is411px wide and19800px tall; viewport411x808. Thus
this snapshot shows a correctly classified, already-hidden surface. It does not
show the brief visible state or prove a rejected label. Four inaccessible
iframes do NOT prove the prompt is inside an iframe. Original visible bar height
and actual private DOM/classes are not available in this privacy-minimal report.

A matching representative test uses a56px compact fixed DIV with two relative
DIV wrappers and one role=button, over a19800px relative feed. The old48 code
leaves this NEW/replaced surface visible until its RAF check;49 can validate and
hide the entire surface at the mutation microtask checkpoint, before RAF.

## Intentional timing trade-off

Previously all urgent geometry was deferred to RAF. Build49 deliberately permits
**one** synchronous policy validation per rendering batch, only for a new exact
semantic app CTA, or a known owned target overwritten with a stronger inline
!important display value. The complete existing target policy still runs:
modal/form/media/root/oversized protection, compact-surface evidence and whole
surface hiding. No blind microtask ancestor deletion or text-only blanket CSS.

- One shared quota within the active owner engine, reset by its EXISTING RAF
  queue; no additional observer, interval or frame timer.
- Remaining candidates use the original guarded RAF queue. Stable owned nodes
  and unrelated Search/content do not request urgent layout.
- WeakSet negative cache prevents a previously rejected node repeatedly causing
  synchronous checks on unrelated style mutations; regular RAF revalidation
  still applies. Weak keys do not retain detached nodes.
- Existing CSS guard and beyond-discovery-cap ownership protections stay active.
- The first native run exposed an additional reference-only starvation bug: a
  concurrent2500-button root consumed all384 fast traversal visits before the
  separate new bar. Reproduced by the new three-mode local regression, which
  FAILed reference mode before the fix. The SAME384 total traversal allowance
  is now shared over at most four concurrent roots; no raised scan/layout quota.
  This fixes that separate-root starvation case, not arbitrary unlimited-depth
  discovery. A single huge root can still exceed its bounded allowance.
- Manual report schema2 adds numeric checks/hidden/maxMs for each engine. maxMs
  is the measured largest individual urgent check, NOT total frame time or a
  promise about device performance. No page text/IDs/URLs are added.

This can cause a synchronous style/layout flush for ONE eligible candidate.
It is not truthful to keep claiming zero mutation-microtask geometry. Old zero-
read assertions were updated explicitly: isolated CTA gets one check; a new
independent10-CTA test requires exactly ONE before-paint geometry request, with
all remaining checks in RAF. Ordinary controls still require ZERO such reads.
No phone-wide speedup is claimed. Multiple competing prompts, missed bounded
traversal or protected/unknown dialogs can still require later work or remain
visible. Do not promise universal zero-flash hiding.

## Regression verification

- Nine local DOM suites PASS; JS syntax and diff checks PASS.
- `test-app-prompts49.cjs`: report-shaped bar and fresh replacement disappear
  before RAF; child is not separately hidden; strong known rewrite, Search
  recycling/disable, one-candidate quota, ordinary-control zero layout and large
  surface/negative-cache protection, in all three engine modes.
- Actual48 assets from `a63de38` FAIL the before-RAF assertion;49 PASSes.
- Native Chromium fixture retains the prior16 checks per reference mode and adds
  a17th checkpoint asserting the newly inserted representative whole surface is
  hidden while a scheduled RAF has NOT fired. OFF restoration follows that
  checkpoint, so configuration mutations do not compete for the single quota.

Production Kotlin, Manifest, lifecycle/Copy/website refresh/media/PiP/audio and
early-start injection are byte-identical to48. No login/cache/cookie clearing.
Real-account confirmation is still required; the supplied report is a snapshot,
not a captured rendering timeline or proof of the exact phone-side flash cause.

## Exact CI results — f0327c7224eea70f5a0b5e64519030a6febb2ce5

- APK/unit/lint and all nine DOM suites:
  https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40539380082 — PASS.
- Focused Android13 Chromium:
  https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40539380023
  — all four required cases PASS, no missing/skipped cases accepted by the XML
  evidence gate. Prompt case runs17 checks with reference OFF and again ON.
  The first49 native result was NOT green; its reference insertion failed and
  led to the concurrent-root reproduction and shared-budget fix above.
- Device matrix:
  https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40539380166
  — **1/4 jobs PASS**, not an all-green compatibility claim. Compact API35 PASS;
  debug API29 fails real-tap playback prerequisite of PiP; debug API35 fails that
  plus playbackReportingTracksPageOnEveryProvider; compact API36 fails the
  original-blue Facebook login-button color sample assertion (blue samples=0).
  Cause of those failures is unestablished; they are not dismissed as CI noise.
- Hand-off APK is the actual compact API35 device-verified artifact:
  https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40539380166/artifacts/12751095999

Source archive includes the complete current project/wrapper, not old APKs,
archives, build directories, dependencies, caches or signing credentials. Its
adjacent SHA256 file verifies the archive; no production key is included.
