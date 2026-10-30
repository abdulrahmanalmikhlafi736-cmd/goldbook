# Comment long-press investigation after build61

## Owner correction

Build61 still selects comment text and shows Android's selection ActionMode rather
than letting Facebook handle its own long press. The owner explicitly requests
careful source investigation and Android-emulator diagnosis BEFORE changing the
application again. The build60 prompt-hiding success must remain untouched.

## Source audit

- `facebook.js:readingTarget` and `postSelectionBody` accept generic text nodes.
- `updateSelection` applies `user-select:text!important` to broad p/span/dir-auto
  regions, not just proven posts.
- `prepareSelection` additionally overrides inline selection restrictions and
  calls `stopPropagation` on pointer/touch capture. The contextmenu/selectstart
  capture handlers also stop propagation for reading targets.
- Unrecognised comments therefore receive both native selection and event
  interception. Filtering Android Copy alone would NOT restore website handlers.
- Build61's inference depends on comment permalinks and other guessed metadata.
  A comment need not expose those markers before a long press.
- Native MainActivity has `isLongClickable=true`, preserving WebView ActionMode;
  it contains no separate Facebook-comment implementation/menu to switch on.
- The vendored site scripts contain no authoritative Facebook comment handler.
  Facebook's actual menu/markup is remote, not source bundled in this project.

## Tests-only Android baseline (production unchanged)

Commit `3ad049a859a719b9022a7e1c1521a30eb9bf5fce` changes ONLY androidTest.
No version bump, APK delivery, production fix or prompt-controller change.

[Android13 run41120861409](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41120861409), check124286781110: **FAIL as expected** on unchanged61.

Actual injected MotionEvent long press on a comment-like span without comment
classes/roles/permalink:

- Android selected `FPROopaque`.
- Test website pointerdown count **0**.
- Test website touchstart count **0**.
- Test website hold-handler count **0**.

The native assertion reports all these values; it is not just a computed CSS
check. The existing three recognised-comment negatives and four positive post
Copy/clipboard cases precede this new target. The other8 required focused test
cases PASS, including the unchanged prompt first-frame regression.

The website handler in this test is explicitly a fixture sentinel, NOT Facebook's
official menu or a captured private-account DOM. This demonstrates a concrete
failure mechanism, not exact account-layout identification. Do not add a new
selector and claim the owner's problem is solved from this fixture alone.

## Needed before an account-specific production fix

Observe the real touched comment and its structural context, without collecting
text, account URLs, author IDs, cookies or tokens. Current diagnostics report
selection status but not enough structural evidence to distinguish an anonymous
post from an anonymous comment. A separately authorised, privacy-limited diagnostic
build could expose only tag/role/component structure and event routing after the
owner's long press. No need for account credentials or remote account access.

Do not change the successful app-prompt engine, disable native selection globally,
replace Facebook's menu with a fake one, or pretend synthetic tests prove the
private account. Build61's previously documented wider failures remain unresolved.
