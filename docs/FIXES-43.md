# Build43 — owner-reported Copy regression; remove rejected native refresh

Owner reports Copy no longer works in42, explicitly wants the site's own pull
refresh, not an added native replacement, and proposes disabling forced text
selection temporarily to compare browsing. This report supersedes positive
fixture results: account Copy was NOT established by those fixtures.

## Removed, not hidden behind another setting

Remove NativePullRefresh, PullRefreshGesture, pull-refresh.js and their native
MainActivity wiring and fallback-only tests. No native drag-to-reload callback,
new refresh button, replacement gesture recognizer or synthetic site events.
Keep the independent SingleFlightQuery backpressure from42; it does not consume
input or reload pages. Existing manual settings retry behavior is unchanged.

## Targeted Copy repair

Two code-level hazards added in41 are directly reproducible:

- An unfamiliar role-button containing a plain span inside an article was
  unconditionally treated as an action, so its actual post/comment text could
  bypass native-selection protection. Pressed/popup metadata and aria-labels
  beginning with Like could likewise exclude reading wrappers.
- The extra descendant role-button `user-select:none!important` rule could
  override prepared reading descendants. Remove that rule: selection CSS and
  preparation/hashtag/default/contextmenu handlers again match the build23
  golden source. The golden still allows ONE declared dispatch hook, so this
  is not a claim of a byte-identical whole-engine rollback.

Narrow the remaining action exclusion to positive evidence (reaction URL/sigil/
testid, exact/counter-only visible actions, or explicit icon-only actions).
Unknown roles, pressed/popup metadata alone, and prose-prefixed aria labels no
longer veto real reading. A toolbar wrapping an article does not turn that whole
article into an action. Known compound reaction controls keep delegated input.

No cookie/cache/preferences clearing, no forced disabling of the user's selection
setting, no player35/recovery36/fullscreen40 rewrite. Default native Copy option
stays ON; owner can independently turn it OFF for a same-build comparison.

## Site pull refresh: precise boundary, no false guarantee

With “تحديد النص بالقائمة الأصلية للجوال” OFF, FPRO's selection capture handlers
and selection stylesheet are inactive; pointer/touch start/move/end/contextmenu
reach the site. This is event-propagation evidence, not a claim that an actual
Facebook server refresh happened. The site remains responsible for its gesture.

With forced selection ON, the build23 reading protection still stops delegated
reading starts so the site cannot cancel native Copy. Site pull refresh may
therefore still conflict with that protection. This patch does NOT pretend to
solve both by substituting native reload. Testing ON vs OFF on the SAME build,
route and comparable browsing duration can help isolate a contribution; neither
one successful session nor one stall establishes the sole root cause. The owner
is not being asked to identify DOM/native internals or provide login details.

## Validation

Local syntax + four suites PASS: injection, browsing, interaction, selection43;
diff check PASS. New cases cover plain role-button spans inside articles,
pressed/popup reading wrappers, prose aria labels, unchanged build23 CSS, native
defaults, no native reload observer, and complete site event flow with selection
OFF. The previous unsupported requirement that every unknown role-button inside
an article is an action is replaced by the explicit reading-wrapper regressions;
known reaction cases remain tested.

Native Copy fixture now also long-presses `wrappedPlain`, a plain span in a
role-button/popup reading wrapper inside an article, requiring the real Android
selection and Copy action. Existing post/comment/hashtag/direct-div assertions
and actual reaction hold/tap remain.

[Build/lint/JVM/four DOM suites 40274729407](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40274729407): PASS.
[Explicit native XML inspection 40275334638](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40275334638): PASS, requiring both native Copy (including wrappedPlain) and held reaction/tap tests on API29 and API35, with no skip accepted for those four results.
Exact tested app/test source: `c67675248c1814ce591a43e60b752eacb3e331bd`.

[Full matrix 40274729405](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40274729405): **1/4**, not all green. API35 compact PASS; API29/35 debug fail the existing real-tap playback prerequisite in PiP; API36 compact fails local HTML accessibility. No failed result is counted successful, no assertions disabled to label this an account fix.

[Exact compact APK verified on API35](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40274729405/artifacts/12630141296), artifact ZIP 1,015,348 bytes.
[Complete clean source43](../downloads/FPRO-build43-source.zip), adjacent SHA256 and SOURCE-COMMIT.txt identify the snapshot and exact tested app source.
[PR3](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/pull/3) remains open, not automatically merged.
These fixtures do not establish account Copy or actual site refresh. Owner verification remains necessary.
