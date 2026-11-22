# Build63 — return to the opened home-feed post

## Owner report and scope

Build62 is owner-confirmed smooth and keeps Open App completely hidden. The new
issue is returning from a post/comments to a position4–6 posts below the source.
This change MUST NOT modify the confirmed prompt implementation or imported
filters/selection. The private Facebook account has not been inspected: feed
height changes and browser history restoration are a reproduced mechanism, not a
claim that one particular Facebook callback is conclusively the account cause.

## Implementation

`feed-return.js` is injected before the existing engines, with the existing
`rememberPosition` preference. At a feed-post click it records a post identifier,
its viewport offset and the source URL. Supported roots: article/role-article,
FeedUnit, tracking-duration, data-ft post IDs and mobile Bloks MContainer cards.
No post body/form/cookie data is copied. At most one short checkpoint is kept in
same-origin sessionStorage (10-minute expiry) and one source node in memory.

A recent actual history departure commits the checkpoint. Returning through
popstate, BFCache pageshow or full-document back_forward navigation starts a
bounded correction against the SAME post, not an old numeric scrollY. A deliberate
new Home push is not treated as Back. Existing history.state and method results
are preserved; no synthetic site events or refresh controls are introduced.

Correction uses the actual scroll container (or window), starts on a render
frame, and allows at most16 attempts150ms apart for late image/filter layout.
The active job stops immediately on real pointer/touch/wheel/keyboard input,
URL change or disabling the preference. No observer or polling runs during
ordinary idle browsing. If the post is missing or cannot be identified, the
helper does NOT scroll to a guessed unrelated location.

Native Back retains fullscreen/settings/home behavior. A known post departure
uses history-back rather than first scrolling the detail page to its top. When
native Back closes a same-URL dialog, the anchor helper is notified directly,
without broadcasting a synthetic DOM event.

## Local verification

-23 DOM suites pass on Node24.22.1/jsdom29.1.1 (22 unchanged suites + new helper).
- New tests: source post offset with changed heights, late layout, nested scroller,
  replaced post node, missing post/no guessed fallback, deliberate Home visit,
  same-URL dialog, cancellation/OFF, bounded attempts/no idle polling, Bloks,
  FeedUnit/data-ft roots, full-document back vs fresh navigation, expiry and
  identifier-only persistence.
- The exact build62 `app-prompt-engine.js`, `site-engine.js`, and `facebook.js`
  bytes are unchanged. Version code63; version name remains0.0.1.

## Device verification

A new Android13 instrumented regression uses a real WebView, trusted click on a
Comments button, Activity BackHandler/WebView history-back, two simulated layout
shifts and trusted touch cancellation. The page is synthetic, NOT logged-in
Facebook. Final result **PASS**, run41208266445. The post returned to exactly
100px (initial100px) despite spacer height increasing700->1300->1500px. Actual
windowY1400px;2 corrections,9 attempts,1 trusted cancellation; no retained
checkpoint/active timer after cancellation. See `FEED-RETURN-63-ANDROID.json`.

- Native test: https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41208266445
- Build/unit/lint/23 DOM suites: **PASS** run41208383930 (same production assets,
  additional full-document tests), compatibility24.04/26.04 **PASS**41208383947.
- Build62 prompt workload recheck **PASS**41208198454. Broader Android13 suite
  again8 PASS/1 known comment-copy FAIL, run41208266319. Prompt first-frame
  hiding, fixed transitions, native layout and palette tests still PASS.
- Exact compact APK black-box device checks succeeded on API36 (job124557708999).
  API35 also completed its tests and uploaded the success-only artifact; overall
  matrix still includes pre-existing debug/comment failures and is not all green.
- Small APK ZIP (~1.08MB): https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41208266412/artifacts/13045612613
- APK production sourcec498f25 is byte-identical to later tests/docs commits.

The pre-existing opaque-comment/native-copy regression remains outside this
scope. Do not describe the entire repository device matrix as passing if that
known test still fails.

## Remaining limits

Unknown Facebook layouts without usable post identity fall back to browser/site
behavior. Source cards removed by virtualization, source readings older than
10minutes, or layout changes after the short settling window are not guaranteed.
There is no perpetual scroll lock: user input always wins. The owner account's
post/comments navigation must confirm the final behavior.
