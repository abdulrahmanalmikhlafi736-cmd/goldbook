# Build59 — broader early app-prompt filtering; post-only selection

Version0.0.1 / versionCode59. Owner explicitly reports the Open App call stays
visible even with the option ON in58. This supersedes any implication of account
acceptance: neither57 nor58 resolved the owner's report.

## Baseline on untouched58 production

Test-only commit30a37fb leaves58 production unchanged and adds two required
Android13 cases. Run41103087586, check124224777366, prior7 cases PASS:
https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41103087586

- New real document-start case FAIL: early=true, plain=false, bar=false,
  wrapped=false; Search/account/password/main=true, exposed=12/12. Thus the source
  actually injected early, but upstream58 discovery did not hide these prompts.
  These are controlled representative shapes, NOT the owner's private DOM.
- New real long-press case hit test-only `UiAutomation.clearCache()` missing on
  Android13; NOT proof that the comment negative assertion had run. It preserves
  actual native post/hashtag selection, Copy action clicking, negative comment
  selection and Copy absence assertions. Restrict only this optional cache refresh
  to API35+, where supported. No test skipped or expectation weakened.
- Old58 native evidence already showed a first-frame CTA failure in the wider
  matrix. No claim that this controlled test explains every owner occurrence.

## CTA implementation

Materialbook/Nobook coloring/AMOLED/other hiding/sticky behavior stays imported.
ONLY Open App now uses `app-prompt-engine.js`, loaded before the site engine in
both document-start and ordinary injection. With that module present the two
narrow upstream footer/glyph factories are NOT mounted. Legacy FproNoapp and the
old main prompt filter remain disabled in the production upstream configuration.
One active CTA implementation, not three competing restoration owners.

The new controller uses existing appBanner + pageEnhancements/master settings:
- Arabic/English exact app-call captions and several other languages; accessible
  action names; focusable/tabindex/action widgets; the upstream app glyph; official
  FB app-intent/store links as corroborating evidence, not every intent/link.
- Text-only calls do not require the old homepage Facebook-logo check, footer
  metadata or Reels URL. Known footer metadata is discovery evidence, not blanket
  permission to hide all fixed bars.
- A document stylesheet provides early exact accessible-action matching and
  persistent hiding of verified owned targets. Text-only nodes are examined at
  initialization and the mutation checkpoint; not delayed until page Finished.
- Hide an identified leaf regardless of a generic fixed/fullscreen page ancestor;
  never hide main/feed/page/nav/header hosts. Promote only a dedicated compact
  surface up to160px with known app controls/optional dismissal and no protected
  descendants. Retain its geometry while hidden. This avoids leaving the known
  full-width background strip behind a hidden button.
- Reassert inline `display:none!important` when the site rewrites style. Recycled
  captions/structural safety changes are revalidated; OFF/master OFF restores only
  owned declarations and removes the early stylesheet/root flag. No deletion of
  site nodes, body curtain, global intent hiding, synthetic clicks or new polling.
- Forms/editors, page/nav hosts, media elements and descendants, ordinary prose
  and FPRO tools are protected. Blocking dialogs stay protected; a media-viewer
  dialog without a form can expose an individually identified call, never grant
  permission to hide the whole viewer/dialog.

Per mutation, prioritize actionable/footer roots before the8-root cap; each has
up to96 directed candidates,48 footer descendants and800 general candidates.
Native querySelectorAll still scans/materializes results; there is NO hard native
traversal/wall-clock bound or performance guarantee. Text extraction stops at64
text nodes/200 characters. Owned/rejected sets cap2560 and discard disconnected
nodes. This cannot prove visibility never occurs: unsupported early injection,
unknown labels/structures, caps, CSP/provider/compositor/network behavior and
site changes remain limitations. No universal zero-flash or account-fix claim.

The explicit diagnostics report remains schema4 for compatibility and includes
`independent` numerical counters and `ownedIndependent`; legacy state fields
remain historical, not the new engine's status. No raw private text, URLs, IDs,
class names, form values or account credentials are exported by these additions.

## Selection / copy

Preferences now serializes selectionScope=posts. Native browser selection and
Android's real Copy action remain, but positive post-body regions only: explicit
message bodies and readable p/dir=auto within article context. Known comment
roles/IDs/sigils/test IDs, comment-labelled/nested article regions are excluded;
there is no generic body-wide p/span forcing in this production scope.

Comment pointer/context/selectstart events reach the site. Comment hashtag links
are NOT temporarily disarmed. Post hashtags retain the existing native selection
path, restoring href on release. A prepared post recycled into a comment loses
FPRO's old inline overrides at the next comment interaction. Comment descendants
use user-select:none, but inputs/textarea/contenteditable stay editable/auto.
No clipboard interception and no attempt to disable Facebook's own custom Copy
commands. Unknown unmarked comment/post layouts cannot be perfectly inferred.

Historical tests omitting selectionScope retain build23/43 behavior; that is NOT
the production default. The two frozen-source assertions normalize only the new
conditional hashtag gate (inert in the historical scope), alongside their prior
positive-action gate. All old behavior assertions remain. New scope tests and
real native positive/negative Copy checks are separate requirements.

## Verification

Local Node24.22.1:19 discovered suites PASS, including new test-prompts-selection59:
plain captions, aria, focusable call after32 sibling roots, generic fixed main,
footer after3000 nodes without home-logo gate,8 inline-important rewrites,
recycle/OFF/master OFF, Search/forms/prose/media protection, post and hashtag
selection, comment event propagation/editor and prepared-node recycling.

Android13 focused workflow now requires9 results: the prior7 plus real first-frame
and real native post/hashtag Copy vs negative-comment Copy. First production5ac9a50
already passes the new first-frame test; Copy was still blocked by the harness
API call, corrected separately without changing production selection behavior.
Final run links/results follow; do not count the harness failure as passing Copy.

Wider device tests remain required separately. Existing PiP prerequisites and
previous58 AMOLED/other layout gaps are not silently changed in this request.
No merge authorization, no removal of installed data, no release WebView debugging.
Native UI reference retained: https://developer.android.com/develop/ui/compose/documentation?hl=ar


## Final executed evidence

Production/native-test source `ec533403eca61357ee3876e9747c5a3582470f44`.
Subsequent deliverable changes are docs/archive only.

- [Android13: all9 required cases PASS](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41105088691), check124232584263: productionPromptRulesHideBeforeFirstFrameAndRestoreOff and nativeCopyIsAvailableForPostsAndHashtagsButNotComments both PASS, plus prior7. No missing/skipped results. First-frame plain/bar/wrapped all hidden, Search/account/input/main retained;0 exposed/12 rewrite samples; OFF restores. Real MotionEvent long press selects post and hashtag, Android Copy action appears and is actually clicked, comment text not selected and Copy absent.
- [Build/unit/lint/19 DOM/debug+compact APK PASS](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41105088798). Compact artifact13000208559, debug12999599577, reports12999689395.
- [Node24.22.1 /19 suites on Ubuntu24.04 AND26.04 PASS](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41105088808). Same19 suites PASS locally after final code.
- [Wider matrix FAIL:1/4 jobs PASS](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41105088759). Compact35/check124232584779 PASS. Compact36/check124232584113 fails3 app-open assertions. Debug29/check124232584566 fails PiP playback prerequisite, real post long-press selection, fixture-null and production prompt fixture completion. Debug35/check124232585038 fails PiP, combined document-start/AMOLED case and production prompt fixture completion. These timeouts/selection/platform failures are unresolved, not conclusively dismissed as environment-only, and NOT overridden by the focused Android13 success. Assertions retained; no claim the full matrix is green.

Computed layout/RAF checks are not compositor pixel capture, arbitrary-network
coverage or private signed-in Facebook proof. The owner's actual59 account result
is not yet known. Never say zero flash is guaranteed from these fixture results.
