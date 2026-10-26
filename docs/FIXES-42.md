# Build42 — native pull fallback and native-to-renderer backpressure

## New report / actual inspection

Owner also cannot pull down to refresh after browsing stalls, and asks whether
MainActivity size or accumulating files/settings is responsible. File length does
not itself execute work or cause a leak. No account/device trace establishes a
cache-file/settings accumulation cause, so nothing clears cookies, site storage,
cache, saved login or preferences as a purported fix.

Inspection found two concrete mechanisms:

1. There was no native pull-refresh controller. Refresh depended on the site's
   delegated gesture handlers, but the deliberately preserved build23 reading
   guard stops pointerdown/touchstart propagation from reading to those handlers
   so WebView native text selection cannot be cancelled by the site. Normal
   scroll still works as a native default. Thus site gesture refresh and native
   Copy can conflict; passing Like actions through in41 does not solve reading
   drags. Synthesizing/replaying a fake trusted pointerdown is not a safe repair.
2. MainActivity's header query loop (650/1200ms), startup readiness loop (250ms)
   and position checkpoint calls could enqueue another evaluateJavascript before
   the earlier callback returned. If a renderer stalls, native periodic work
   continues submitting requests. This is demonstrable missing backpressure,
   NOT an observed count/heap trace from the owner's phone.

## Precise change, not wholesale activity rewrite

- `SingleFlightQuery.kt`: one unanswered request per background channel. No
  timeout that queues a new request behind an unanswered one. Navigation and
  destruction invalidate tickets; old callbacks cannot mutate the new page or
  clear its pending ticket. Header, readiness and checkpoint paths use it.
- `PullRefreshGesture.kt`: pure, unit-testable gesture policy, extracted rather
  than adding large touch logic to MainActivity. A single finger starts at top,
  moves downward before the native long-press deadline, travels >=96dp, remains
  predominantly vertical and ends within1500ms. Short scrolls, sideways/upward
  motion, long-press/selection handles, multitouch and cancellation do not reload.
- `NativePullRefresh.kt`: observes the existing native touch stream and always
  leaves dispatch to WebView; never steals/cancels/replays input. After an
  eligible completed pull, reload once with2500ms cooldown. Loading progress
  continues through the existing native page-loading path; no large new UI.
- `pull-refresh.js`: one eligibility query per down, also single-flight. Check
  document AND touched nested scroll ancestors at top; reject active selection,
  focused drafts, actual actions/links, media, controls, dialogs and unknown deep
  trees. Coordinates are converted from native pixels to CSS viewport units.
  Reject fullscreen/PiP/audio-only/settings/splash/non-Facebook on native side.
- Stop sending a redundant position-cancel JavaScript on every ordinary tap
  when no recovery is pending. A real first touch still cancels pending recovery.
- Invalidate gestures on navigation, pause, destroy. No new service, observer,
  permanent JavaScript event listener, polling loop or dependency.

The native fallback needs its eligibility answer before finger release. If
Chromium is genuinely unable to execute any JS, it **fails closed**, rather than
reload a nested feed/draft/selection based on unknown state or reload late after
release. It is not a renderer watchdog or guaranteed recovery from a hard hang.
The existing native Settings reload/retry path remains available in that case.
Build41 bounded/color/retention protections remain unchanged. Legacy settled
whole-feed tint is still synchronous; no promise that all long tasks disappear.

## Tests and delivery

Local DOM/browsing/interaction and new pull eligibility suites PASS. New JVM
cases require exactly one accepted request across10,000 unanswered poll attempts,
next-request release, duplicate/old result isolation, gesture threshold, early
movement vs long press, cancellation, JS rejection/no answer and top boundaries.

New OS-input instrumentation `nativePullReloadsOnceDespiteBlockedSiteDownAndKeepsStorage`
uses the actual MainActivity host binding on API35, intercepted HTTPS fixture
responses, native finger down/move/up and the build23 reading guard. It
requires short scroll=no reload, delegated site pointerdown=0, deliberate pull=
exactly one real second navigation/response, cookies and localStorage retained,
and no refresh loop. Independently, `nativePullComponentWorksWithSelectionGuardAndRetainsStorage`
exercises the identical controller with a controlled non-Facebook origin on both
API29/35, like the existing Copy fixture. Production Facebook-only origin gating
is not weakened. Existing actual native Copy and reaction-hold tests remain.

The first API29 real-host fixture was NOT successful: a native error overlay
covered the WebView, and diagnostic evidence showed **zero native touch events**
(`nowAllowed=true events=0 ... failure=true`). Thus its short-drag/site-down
checks alone were not sufficient input evidence. No input assertion was changed
to accept a failed reload, no engine UA was spoofed, and no production error UI
was disabled. The modern real-host test remains required on35; on29 it is
explicitly SKIPPED, with independent native controller/selection/storage coverage
at the controlled origin instead. Do not report the29 real-host integration as
passed. CI/device outcomes pending. Fixture success is not account proof.
