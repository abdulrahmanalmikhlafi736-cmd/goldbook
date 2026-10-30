# Build61 — exclude mobile comments; preserve confirmed prompt success

The owner confirms build60 no longer shows Open App at all on their account.
They also confirm comments became selectable/copyable and request disabling that
feature on comments only. Post selection and editable reply fields must remain.

## Scope

The build60 app-prompt engine, early injection and site engine are byte-for-byte
unchanged. This is a selection-only repair, not another prompt-controller change.
No unrelated media, download, fullscreen, theme or refresh changes. No merge
permission granted.

Build60's comment exclusions depended on explicit roles/IDs. Mobile Bloks comments
can instead be ordinary div/native-text nodes without those markers. Build61 adds
legacy comment classes/components and infers unlabelled comment cards only when
they contain a comment/reply permalink, an author link, a Reply action and reading
text. It does NOT assume nested articles are comments, block a whole story page,
or disable generic post text again. Comment action footers alone are insufficient.
Inferred markers are owned, removed for recycled containers or selection OFF,
and updated for live content. Reply inputs/editors remain editable. No synthetic
clipboard/menu or website events; website comment handlers keep receiving events.

These are testable layout rules, not proof of the owner's exact private DOM or
all future Facebook layouts. User verification is still needed for their comments.

## Executed baseline and tests

- New `tools/test-comments61.cjs` fails on unchanged60: the unlabelled mobile
  comment gains `data-fpro-selectable-text`. No CTA production changes involved.
- Final local Node24.22.1: all **21 discovered DOM suites PASS**. New suite covers
  unlabelled mobile and legacy comments, original/nested posts, editable reply,
  newly appended comments, recycled cards and selection OFF cleanup. Prior20
  suites unchanged and passing.
- Native test retains actual post/hashtag/plain/nested long presses, native Copy
  and exact clipboard equality. Adds negative unlabelled-mobile and legacy comment
  targets alongside existing explicit comment target. Scroll each target into
  view before genuine MotionEvent presses, without programmatically selecting it.
- Focused Android13 [41116338251](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41116338251): **all9 PASS**, check124271432027. All4 post targets select and copy the exact text to the clipboard; all3 comment targets have no native selection or Copy. Existing prompt regressions also PASS.
- Build/unit/lint/APKs [41116338329](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41116338329): **PASS**, compact13005703278, debug13005114074, reports13005553272.
- Tools [41116338441](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41116338441): **PASS** on Ubuntu24.04 and26.04.
- Wider matrix [41116338362](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41116338362): **FAIL,1/4 jobs PASS**. Compact35 PASS. Compact36 fails all3 app-open assertions. Debug29 fails PiP playback prerequisite, imported-engine null fixture and production fixture completion. Debug35 fails playback reporting, PiP prerequisite, combined first-frame/AMOLED and production fixture completion. These are unresolved, not conclusively environment-only, and not overridden by focused Android13 success. No unrelated repair claimed here.

Version0.0.1/code61, Android7+. Do not delete account data if APK signatures differ.
Debug WebView remains debug-only. Native UI reference unchanged:
https://developer.android.com/develop/ui/compose/documentation?hl=ar
