# Faceboost 2.18.8 — home gesture follow-up

The owner confirmed Like is fixed in 2.18.7, but supplied screenshots showing
home swipes still opening Create Story. Direction is uncertain in RTL. Do not
claim the previous home guard worked on the account.

Builds pinned source `fe8a474b25414b38819b7cf927720899c8c89705`, versionCode
2180008. Like snippets are byte-identical to owner-confirmed 2.18.7. Media helper
is identical except its version comment: fullscreen/seek/footer geometry retained.

## Narrow follow-up

Source inspection found no native horizontal-drag handler opening story creation.
The previous JS guard had three demonstrable weaknesses, not an established account
root cause: installation after page listeners, exempting any button ancestor and
any horizontally overflowing ancestor (including a whole-screen paging shell),
and blocking only one direction.

- `HomeSwipeGuard.install` registers the asset with the existing AndroidX WebKit
  DOCUMENT_START_SCRIPT API before initial navigation, restricted to HTTPS Facebook
  origins. Unsupported WebViews retain the late engine fallback, without a crash.
- Both horizontal directions are gated on ordinary home URLs. Input/editing,
  sliders, native system edges, text selection, pinch/multitouch, identifiable
  compact horizontal galleries and story trays remain exempt. Fullscreen/modal/
  non-home/media-viewer contexts are excluded.
- Buttons/links still receive ordinary taps and vertical gestures. Merely starting
  on a button no longer exempts a horizontal page swipe. Page-height overflow no
  longer masquerades as a photo carousel.
- No touchstart cancellation, synthetic site events, native MotionEvent interception,
  navigation/history rewrite, story removal, global touch-action CSS or polling.

## Tests

40 local DOM/production-script cases pass. Six inherited WebView fixtures plus one
new fixture are required by CI. The new fixture uses the actual production native
installer, intercepted HTTPS HTML, and a page-authored window capture listener;
it checks document-start precedence, both directions, vertical passage and taps.
Check actual workflow status before calling the seven native fixtures successful.
These are controlled synthetic event fixtures, not account/physical-touch proof.
The precise Facebook implementation and unknown carousel shapes still require
owner acceptance; do not promise universal blocking from screenshots alone.

Apply once to clean pinned source:
`python3 integrations/faceboost-2.18.8/apply.py /path/to/source`

Run with jsdom@26.1.0:
```
FACEBOOST_SOURCE=/path/to/patched-source JSDOM_PATH=/path/to/jsdom \
node --test integrations/faceboost-2.18.8/*.test.cjs
```

CTA/selection/audio/themes/signing remain untouched. No full inherited unit/lint
suite or heat/security certification is claimed. GPL-3.0-or-later.
