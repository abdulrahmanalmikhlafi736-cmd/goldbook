# Faceboost Almekhlafi 2.18.7: intentional Like and home-only swipe gate

Builds pinned faceboost-review `fe8a474b25414b38819b7cf927720899c8c89705`
with the accepted 2.18.6 media implementation and these two scoped changes.
Goldbook application sources and the remote faceboost-review repository are not
replaced. Identity/signing configuration is preserved; versionCode 2180007.

## Like

- Exactly one approved MouseEvent object bypasses the inherited click swallow
  guard. All unrelated clicks/pointerups retain the guard; it is not globally
  disabled and there is no broad replay flag or blind retry.
- Target selection is tied to the active video's private ancestor scope. Portal
  rails require an explicit localized reaction label and geometry. Ambiguous,
  disabled, hidden or modal-owned targets are refused rather than guessed.
- No success animation when no button was found, or when its state did not change.
  Observe official aria state / known label / legacy reaction-image transition.
  One bounded 1200ms observation, no repeated clicking. Multiple taps while an
  intent is pending cannot accidentally toggle a successful like back off.
- Ignore stale results after a source/route/video/target change. A changed site
  button is observed UI evidence, NOT a guarantee that Meta's server persisted it.

## Home swipe

A separate once-per-document module consumes a deliberate one-finger leftward
swipe on neutral home-feed content only. It checks route on every phase and
requires at least 20 CSS px with horizontal dominance. It preserves vertical
scrolling, right swipes, pinch/multitouch, text selection, system edges, form/action
controls, story buttons and identifiable horizontal carousels. Video/reel/story/
message routes and root story filters are excluded. No synthetic cancel, story
node deletion, navigation rewrite, global touch-action CSS or periodic scans.

This prevents the gesture path rather than removing all story creation. Existing
site listeners on window may precede this listener; unknown account DOM and
horizontal media structures require owner acceptance. No universal interception
claim is made without a real account/device test.

## Validation

32 local DOM/policy/integrated production-script tests pass. The workflow then
builds release/debug/test APKs and requires all 6 controlled real-WebView fixtures
on Android 13 before publishing a candidate. Check actual run status separately.
Fixtures use synthetic events and controlled geometry: not a signed-in account or
trusted native-touch proof. No full inherited unit/lint suite is asserted.

Apply with `python3 integrations/faceboost-2.18.7/apply.py /path/to/pinned-source`.
Install jsdom@26.1.0 in a temporary harness and run:

```
FACEBOOST_SOURCE=/path/to/patched-source JSDOM_PATH=/path/to/jsdom \
node --test integrations/faceboost-2.18.7/*.test.cjs
```

CTA, selection/copy, themes, audio services, accepted footer geometry and upper
40% fullscreen entry remain unchanged. Earlier deferred security/update issues
are not certified or fixed here. GPL-3.0-or-later; preserve upstream attribution.
