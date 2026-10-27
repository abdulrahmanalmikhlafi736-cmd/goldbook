# Build50 — preserve prompt discovery when page structure changes

Version0.0.1 / versionCode50. Production `94a739f360b19ba111eb94f874383d93d0793209`.

## New owner evidence

Unlike48's already-hidden snapshot, the supplied49 screenshot and schema2 report
show a VISIBLE bottom Open App CTA: viewport411x808, fixed DIV411x65 near y744,
relative wrappers65/59px, nested semantic role=button389x39, no ownership marker
on the candidate or its ancestors, and23 controls in the containing1752px page.
The same reference safety classifier returns structuralEligible=true and
 targetKind=surface. Thus classification succeeds AT CAPTURE but hiding has not
been applied to this surface. Counters checks=1/hidden=1/maxMs=0.9 describe prior
urgent work, NOT proof that this visible candidate was hidden. Three inaccessible
iframes do not establish causation.

Schema2 does NOT say whether the active appBanner setting was ON at capture,
whether the body was replaced, or which mutations preceded the screenshot. We
cannot honestly identify the exact account-side cause from this snapshot alone.
No authenticated/private DOM is available. The following independently reproduced
49 gaps are fixed, rather than claiming a proven phone-side navigation timeline.

## Focused changes

1. The SAME existing MutationObserver now observes the stable Document, with its
   existing attribute filter, rather than the old body/head nodes. Replacing a
   body cannot silently leave observation attached to the removed page. Master
   OFF still disconnects it; ON classifies the current body. No second observer,
   new interval, page reload or synthetic site event.
2. A nonsemantic wrapper's class/style/role/open/aria-modal change can make its
   nested CTA newly eligible without modifying the control. Previously the fast
   local path checked only the wrapper itself. Now up to FOUR such wrappers use
   the existing bounded prompt-only descendant path. This does NOT recolor their
   subtrees. Its limits remain384 visits per reference batch/shared roots or
   bounded384 descendants per fallback root, and48 matching candidate queues.
   This is additional bounded DOM traversal for wrapper changes, NOT zero extra
   CPU work. The one-urgent-layout quota is unchanged; ordinary controls still
   cannot authorize geometry/hiding. BODY/HTML/HEAD are not wrapper candidates.
3. Detached nodes in queued removal/mutation records are discarded before they
   can consume the one urgent check. A regression intentionally adds an old CTA
   just before removing its body; it must not delay the new current-page bar.
4. Manual report schema3 adds ONLY active boolean filter/master/reference state,
   document-observation state, style-connected state, hidden-document state and
   numeric scan count. It does not expose account text, page names, selectors,
   URLs, storage, cookies or images. It performs no automatic upload.

The complete existing safe-target classifier still decides every hide. A modal
remains usable while blocking; removing aria-modal allows reclassification only
if the entire compact dedicated surface passes all current guards. No arbitrary
parent/root/body hiding, modal dismissal, scroll unlocking or fullscreen curtain.
46 black-strip fix,49 timing quota/negative cache and CSS ownership guard remain.
Production Android Kotlin/Manifest/early-start, Copy, website refresh, selection,
video/audio/PiP behavior are unchanged from49.

## Regression evidence

- New three-mode50 suite: body replacement with a representative65px fixed bar,
 23 other controls and stale detached CTA records; whole bar hides before RAF,
  page and child remain intact. Independent modal-to-bar ancestor mutation,
  report active-state fields, master-OFF disconnect and re-enable also tested.
- Actual49 implementation FAILs the body-replacement check. An intermediate50
  fix without the detached-node guard FAILs the stale-record variant; guard PASS.
  Ancestor-transition check also FAILed before the wrapper fix, then PASSed.
- All TEN local suites PASS, including unchanged selection/browsing/interaction,
  black-strip safety and49 one-candidate/ordinary-control geometry limits.
- Native Chromium retains all17 previous checks and adds an18th for replacing
  the body and hiding its new65px fixed bar BEFORE the already-scheduled RAF,
  while preserving Search/Account's main container and the unhidden child.

A single large new subtree may still exceed bounded discovery, and multiple
competing candidates still share one urgent validation. These fixtures do NOT
prove zero flash on every account or that a body replacement occurred on the
owner's page. Actual phone confirmation remains required.

## Exact CI / distribution

Production source `94a739f360b19ba111eb94f874383d93d0793209`:
- APK/unit/lint and ten DOM suites PASS:
  https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40542062434
- Focused Android13 all4 required cases PASS, no missing/skipped cases allowed:
  https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40542062550
  Prompt test runs18 assertions for each reference mode. Additional manual-report
  state/OFF/re-enable assertions in the source50 suite also PASS locally.
- Wider device matrix **2/4 jobs PASS**, not all-green:
  https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40542062349
  Compact API35 and36 PASS. Debug API35 fails the real-tap playback prerequisite
  for PiP; debug API29 fails that prerequisite and playbackReportingTracksPageOnEveryProvider.
  Causes unestablished; no claim that these failures are harmless/infrastructure.
- Hand-off is the actual compact API35 device-verified APK:
  https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40542062349/artifacts/12750998791

Source ZIP is the full current project with executable Gradle wrapper and the
native test clip, excluding historical binaries/archives, dependencies, caches,
build directories and credentials. SHA256 is adjacent to the ZIP. No production
signing key; never uninstall/reset account data to bypass a signing mismatch.
