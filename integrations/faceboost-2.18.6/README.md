# Faceboost Almekhlafi 2.18.6: small owner-requested footer adjustment

Owner accepted 2.18.5's display concept and confirmed upper double-tap fullscreen
100% on their account. Compared with 2.18.5, production changes are only:
- dock top: viewport bottom minus 34 (previously minus 38);
- fill bottom inset: 8 CSS px (previously 12).
These combine to lower the line/ball by 8 CSS px, keeping the 20px ball above the
WebView boundary and the 32px seek target inside it. This is a conservative visual
approximation of the requested half-fingertip, not a physical-size guarantee.
No fullscreen or lower-gesture logic is changed relative to accepted 2.18.5.
Like behavior is reviewed/tested only: existing animation is unconditional even
when no official button was found or its state did not change; it is NOT fixed. A fast second tap also makes the existing window capture guard
self-suppress b.click() while its first-tap swallowUntil is still active; a
200ms second tap avoids that particular guard in the controlled fixture.

The remaining text describes the inherited 2.18.5 scoped implementation:


This integration targets **faceboost-review 2.18.4**, pinned at
`fe8a474b25414b38819b7cf927720899c8c89705`. It does not replace this checkout's
Goldbook application, and does not modify the remote faceboost-review repository.
The workflow builds that pinned new project with this overlay, not Goldbook.

## Scope

- One media progress owner, in a dedicated WebView viewport footer above the
  viewport/system-navigation boundary. No learned seek-line offsets, no changes
  to Facebook's native slider, and no permanent geometry-follow animation loop.
- Keep the emoji ball and gradient, draggable external-download button and live
  video URL resolution. At most one footer is shown for the current visible clip;
  non-overlapping feed videos may each retain their download button.
- Observe video insertion/removal/recycling and detached owned hosts independently
  of the old color/selection scan's interaction throttling. Repair connected
  video UI even when a removed overlay's `hidden` property is still false.
- Entry-only double tap in the upper **40% of the visible video rectangle**, matching
  the approximate marked screenshot region. The header and action controls are
  excluded by the existing gesture eligibility checks. Leave lower Faceboost
  seek/like/hold gesture logic untouched. With this option off, its region is not
  reserved. Existing fullscreen is not toggled by a double tap.
- Suppress only Faceboost's extra seek bar while the new progress owner is enabled;
  keep fit/hide-icons/editor behavior. Remove the 1.2-second rescue watchdog.

CTA hiding, copy/selection, themes, audio/PiP services, identity and signing are
outside this patch. Existing security/update issues noted in review are NOT fixed
or implicitly certified by this scoped build. Local versionCode increments to
2180006; the workflow does not use the inherited inconsistent override scheme.
The inherited signing key is preserved for update compatibility, not endorsed as
safe for public distribution.

## Reproduce

Download the pinned source to a separate directory, then:

```sh
python3 integrations/faceboost-2.18.6/apply.py /path/to/pinned-faceboost
npm install --prefix /tmp/media-harness jsdom@26.1.0
FACEBOOST_SOURCE=/path/to/pinned-faceboost \
JSDOM_PATH=/tmp/media-harness/node_modules/jsdom \
node --test integrations/faceboost-2.18.6/*.test.cjs
```

The apply tool deliberately refuses an unexpected source revision and copies the
four-test Chromium instrumentation fixture into the target source. Its checks
are fixture/controller tests with controlled geometry/rAF, not a signed-in Facebook
session or trusted native-touch test. The DOM gesture integration executes both
production gesture scripts together; input events are synthetic.

## Evidence and acceptance

20 local DOM/policy/integration/diagnostic tests pass. `dom-results.tap` is the local record.
Cloud workflow `Faceboost scoped media 2.18.6` builds release and fixture APKs,
then requires all 4 Chromium fixture tests on Android 13 before publishing the
candidate artifact. Workflow results must be checked separately; this README
never claims they passed just because the workflow exists.

Owner acceptance still required on the actual 2.18.4 installation/device: upgrade
without data loss, footer above three-button AND gesture navigation, captions and
comments not overlapped, dozens of reel transitions, pause/play, upper-zone entry
only, lower left/right/center/hold gestures, return from fullscreen, live current
Seal URL, app background/foreground and unchanged audio/PiP. No guarantee of zero
heat, zero bugs or permanent Facebook DOM compatibility is made.

GPL-3.0-or-later; keep upstream project license and attribution.
