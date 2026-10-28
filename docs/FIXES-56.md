# Build56 — page landmark self-recognition during fixed transitions

Version0.0.1 / versionCode56. Owner's GIF shows bottom “Open app” during initial
loading, entering comments, reaction popup, menus and profile transitions. The
GIF establishes visible behavior/timing, NOT the private page DOM or a unique
root cause. No account credentials/content were requested, copied into fixtures,
or published. No universal zero-flash claim.

## Requested developer/emulator investigation BEFORE production edits

WebView debugging was already enabled by `WebView.setWebContentsDebuggingEnabled(
BuildConfig.DEBUG)` in MainActivity. Keep that debug-only boundary; do NOT enable
remote inspection on compact/release signed-in browsing. New instrumentation
asserts BuildConfig.DEBUG. No production toggle/permission rewrite required.

First pushed ONLY the new Android trusted-touch test and its required-result
workflow entry, commit94ff2b9. Production55 JavaScript remained unchanged.
Real Android13/x86_64 emulator + Chromium WebView, NOT jsdom:
https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40726641930

**Pre-fix result:** prior4 required tests PASS; new transition test FAIL. The
footer had been hidden, a trusted Android touch caused the page landmark to
become fixed, and the previously verified footer was exposed in ALL12 sampled
frames. Native error annotation records trusted=true, exposed=12, samples=12,
page/tools/video/child=true. This was a real native-layout failure before source
changes, not an emulator startup failure or a weakened expected assertion.

The standalone local56 test also FAILed before production edits. Dispatch API
was denied by the GitHub integration; ordinary test-only push triggered the
emulator workflow instead. No credential requests or permission escalation.

## Reproduced bug / narrow fix

Both engines' complete classifier correctly protects positioned page content
when a main/article/feed landmark is a DESCENDANT, but overlooked the SAME
landmark on the positioned ancestor ITSELF. During temporary scroll locking,
`role=main`/main can become fixed to preserve the background position. The code
then treated it as an unknown blocking fullscreen surface and restored an
otherwise verified compact footer. It disappears again when the root becomes
relative/static. This is a reproducible transition-dependent gap consistent with
part of the GIF, NOT proof every account-side occurrence uses this structure.

Add one shared per-positioned-ancestor pageContent check: self.matches OR the
previous descendant query. Reuse it at the two existing large/inset safety gates.
Mirror EXACTLY in facebook.js and reference-engines.js. Main/article/feed host
itself remains forbidden as a hide target; hide only the previously eligible
compact dedicated app bar/control. Existing compact-surface, real navigation,
media/form/content, control text and modal checks remain in force.

This intentionally changes safeAppPromptTarget; do NOT claim all5 classifiers
are now byte-identical52. The other4 classifiers remain unchanged. No broader
CSS app-label rules, page/header/video curtain, synthetic production site events,
new observer, timer, polling or discovery-budget increase.55 bounded geometry
retry/engine CSS,54 discovery and53 read-before-write checkpoint preserved.
No production Kotlin changes other than versionCode; developer debugging still
OFF in compact/release. Node24/Ubuntu24+26/setup-java5/@exodus migration retained.

## Tests / limitations

- New local56 fixture: three engine modes; main/article elements plus
  role=main/article/feed, repeated static->fixed->static transitions, verified
  footer stays hidden; page/Search/profile/video and child display retained;
  OFF restores; actual modal and generic unknown fullscreen overlay still
  protected. All prior tests/expectations retained,16 local suites PASS.
- Native fixture performs Android MotionEvent DOWN/UP through WebView (not JS
  dispatchEvent), asserts Chromium click.isTrusted, uses4 test actions labelled
  Like/Comments/Profile/Menu in EACH of fallback/reference modes; samples12 RAF
  frames per action,96 total, requires ZERO exposed samples and retained page,
  toolbar/video/child. These actions exercise controlled layout transitions,
  NOT actual signed-in Facebook navigation or reaction-menu implementations.
- Existing Chromium26/30-check prompt fixture, renderer replacement, playback
  bridge and subframe-origin tests remain required; new trusted transition case
  is the FIFTH required result, no skipped/missing accepted.
- Computed-display/box sampling is prepaint layout evidence, NOT compositor pixel
  capture, arbitrary network-load proof or all-account UI coverage. Unknown
  non-landmark fullscreen wrappers, true blocking modals, discovery limits and
  style/React patterns outside the reproduced cases remain guarded/limited.

## Post-fix CI evidence

Initial production fix97aa933 passed the SAME Android13 trusted transition test
(0 exposed across96 samples) plus prior4 required cases:
https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40727541721

The first wider run exposed a test-harness problem: missing fixture coordinates
on API29 threw inside an asynchronous UI callback and crashed instrumentation;
API35 also lacked a click report. Tightened test-only DOM/setup readiness and
null/timeout diagnostics in78d8d20, WITHOUT changing production assets or weakening
trusted input, zero exposure, frame count or preserved-control assertions. This
is a harness correction, not a claim all provider behavior is identical.

Exact final source/test commit78d8d2083d69caeaa98cbb9c16190e38c6ab5c80:

- Android build/unit/lint/16 DOM suites **PASS**:
  https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40728809663
- Node24.22.1 /16 suites on BOTH Ubuntu24.04 and26.04 **PASS**:
  https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40728822136
- Android13 **all5 required cases PASS**, no missing/skipped. Existing prompt
  checks26 fallback/30 reference retained; new trusted transition test requires
 0/96 exposed frames. Explicit required-result notices verified via Checks API:
  https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40728809996
- Wider matrix **2/4 PASS**, compact API35 and36. Debug API29/35 still FAIL
  zzPictureInPictureUsesRealPlaybackAndHome: “A real tap must start playback while
  ordinary gesture policy is enabled”. Final failure annotations no longer list
  the new input/transition errors. Media prerequisite causes remain unresolved,
  NOT dismissed as harmless/infrastructure. No unrelated audio/PiP rewrite:
  https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40728809646
- Recommended device-verified compact API35 APK artifact12834302161. API36 also
  verified, artifact12834632759. Reports here use workflow conclusions and exact
  result/error annotations, not a claim full XML/screenshots were downloaded.

Actual owner's account acceptance and universal zero-flash remain unestablished.
Do not uninstall/reset account data if APK signing prevents an in-place update.
