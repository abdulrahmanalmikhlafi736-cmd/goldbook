# Build60 — home interactions and native post Copy

## Owner report and scope

Build59 fully hides the prompt inside videos on the owner's account; preserve
that success. The prompt returns during home-button presses, and post Copy no
longer works. Comments must remain excluded, with editable reply fields intact.
No unrelated media/download/theme/refresh changes and no merge authorization.

## Baseline before the fix

Tests-only commit `a4cf8f5`, unchanged build59 production:

- Local `tools/test-home-copy60.cjs`: a verified home CTA is restored when the
  main page acquires dialog/modal attributes.
- [Android13 baseline41109040769](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41109040769), check124246264683: actual production fixture has **12 exposed rewrite samples**, expected0. Actual MotionEvent long press on a plain Bloks `div.native-text` produces **empty selection**; positive Copy assertion fails. Prior7 independent cases PASS. No assertion disabled.
- A second local test independently reproduces restoration when the surrounding
  page acquires `aria-hidden=true`, which previously erased its CTA's caption
  during candidate revalidation.

These reproduce concrete defects, not the exact DOM or all causes on the owner's
private account. Baseline build/tools workflows fail their newly added DOM test,
not proof of an Android compiler failure.

## Narrow production changes (`dd1bc8f`)

1. Remember homepage main/feed landmarks before transient modal changes. A page
   landmark temporarily becoming modal no longer revokes verified CTA hiding.
   A genuine nested blocking dialog remains protected. This exception is limited
   to `/`; the successful video-dialog branch is not replaced.
2. Ignore decorative hidden/SVG text only **inside** the candidate, not because
   an outer page is accessibility-hidden. Such a page still has visible content.
3. Restore the existing build23-style native reading preparation for plain Bloks
   and nested-article post layouts. Remove the global body selection prohibition
   and the inference that every nested article is a comment. Keep known comment
   regions nonselectable, their events delegated, action/header/navigation
   controls excluded and editable fields editable. No clipboard bridge,
   synthesized site event, native refresh substitute or new selection UI.
4. Replace broad `*comment*`/`comment_` container guesses with explicit comment
   markers, labels and numeric comment IDs. Unmarked structures cannot be
   classified with certainty; this is not a promise for every future layout.

## Verification

- Local Node24.22.1: **20 discovered DOM suites PASS** after the final production
  change, including home modal/aria-hidden transitions, true-sheet protection,
  plain and nested reading preparation, negative comments, OFF restoration, and
  all previous19 suites. No filtering or positive-assertion relaxation.
- [Android13 focused run41109594970](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41109594970): **all9 PASS**, check124248268109. Actual post/hashtag/plain/nested long presses, native Copy actions clicked, negative comment checks retained. This initial version verifies selecting text and clicking Copy, not clipboard contents. Test-only commit `85fdf6d` adds exact clipboard equality after each Copy and a per-target sentinel before every press; its [focused run41110316349](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41110316349) **PASS all9**, check124250733327. All four positive targets copy the exact selected text to the real Android clipboard; comments still have neither selection nor Copy. No skips or weakened assertions. Production remains identical to `dd1bc8f`.
- Final test source `85fdf6d`: [APK/unit/lint41110316405](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41110316405) **PASS**; compact13003508164, debug13003756574, reports13002614449. [Tools41110327158](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41110327158) **PASS**.
- [APK/unit/lint41109595273](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41109595273): **PASS**, including unit tests, lint,20 DOM suites and both APKs. Compact artifact13002562612; debug13003880655.
- [Tools41109594904](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41109594904): **PASS** on Ubuntu24.04 and26.04.
- [Wider matrix41109595020](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41109595020): **FAIL,2/4 jobs PASS**. Compact35 and36 PASS. Debug29 fails the PiP playback prerequisite, imported-engine null fixture, and production prompt fixture completion. Debug35 fails playback reporting, PiP prerequisite and the combined first-frame/AMOLED case. These remain unresolved; not conclusively environment-only, and not overridden by the focused9-case result.

- Final test-only rerun [wider41110316377](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41110316377): **FAIL,1/4 jobs PASS**. Compact35 PASS; compact36 fails all3 app-open assertions. Debug29 fails PiP prerequisite, imported-engine null fixture and production fixture completion. Debug35 fails PiP prerequisite, combined first-frame/AMOLED and production fixture completion. No production changes between the two wider runs. Do not discard either result as environment-only.

No compositor pixel proof, arbitrary-network coverage, guarantee of zero flashes
or private-account confirmation. WebView debugging remains debug-only. Version
0.0.1, versionCode60, Android7+. Do not delete user data to resolve differing APK
signatures. Compose reference retained:
https://developer.android.com/develop/ui/compose/documentation?hl=ar
