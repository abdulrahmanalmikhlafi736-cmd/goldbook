# Faceboost 2.18.9 — isolate owned seek gestures from site capture

Owner reports 2.18.8 still opens Create Story, including when seeking backwards
on the home feed. 2.18.7 Like is owner-confirmed successful and remains untouched.

## Concrete defect found

Previous home gate exempted ALL inputs and Fpro controls. The seek input stopped
pointerdown only during target/bubble, which is too late for page WINDOW capture
listeners; its touch/move/end sequence was not isolated. Thus controlled home
swipe tests did not cover the owner's actual range-drag path. Do not call that
previous account failure fixed retroactively.

## Scoped implementation

The existing document-start installer is retained. Its router now recognizes ONLY
app-created seek controls with a private function hook, including the track/emoji
hit area. It owns the entire pointer/touch start/move/end/cancel sequence before
page capture, prevents native panning ONLY on that 32px control, and directly
calls the bound video's seek implementation. No synthetic site events are sent.

The controller maps CSS x coordinates to the range fraction, clamps the duration,
maintains dragging state, supports pointer capture/outside-range drag, cancellation,
touch-only fallback and pointer+touch deduplication. Source changes/disconnected
nodes cannot seek a recycled clip. Ordinary site ranges are not intercepted.
Keyboard/accessibility input/change retain the existing binding. New primary
pointer sequences cancel stale ownership. No interval, observer or feed-wide scan
was added; per-move work only occurs while that app-owned control is being dragged.

Footer geometry, emoji shape, Like snippets, upper fullscreen policy, download,
CTA, selection/audio/themes/signing are not changed. Whole-page swipe policy from
2.18.8 is retained; this release specifically fixes the missing OWNED-CONTROL path,
not a blanket deletion of Facebook's story composer.

## Validation

47 local DOM/policy/production-script tests, including seven new owned-control
regressions. Eight Android 13 real-WebView fixtures are required by CI, including
production document-start registration followed by a page-authored window capture
listener. The eighth case checks backwards seeking with pointer+touch streams,
zero page-capture leakage, touch-only fallback, and actual Chromium touch-action.
Check actual workflow status before asserting native success. jsdom does not model
touch-action, so that check is deliberately performed in Chromium, not silently
claimed from the DOM harness.

Synthetic controlled WebView events are NOT physical touches or account acceptance.
Unsupported old WebViews retain the late fallback, which cannot promise precedence
over earlier site listeners. No universal account success, heat/security guarantee
or full inherited unit/lint run is claimed. Owner phone confirmation is still needed.

Apply once to clean source `fe8a474b25414b38819b7cf927720899c8c89705`:
`python3 integrations/faceboost-2.18.9/apply.py /path/to/source`

With jsdom@26.1.0:
```
FACEBOOST_SOURCE=/path/to/patched-source JSDOM_PATH=/path/to/jsdom \
node --test integrations/faceboost-2.18.9/*.test.cjs
```

Package com.almekhlafi; versionCode 2180009. GPL-3.0-or-later.
