# Build35 — replace the real account seek surface

Build34's two owner-supplied runtime reports identified two concrete gates, not a
need for another arbitrary bottom offset:

- Both videos have `controls=false` and the same rectangle (0,39,411,730).
- The working page has a Reels route. The broken page does not, but has the same
  isolated, full-viewport player frame (0,0,411,808).
- The broken page has an unlabeled `input[type=range]`, opacity zero, at
  (12,779,387,25), inside an identically sized DIV that paints the gray track.
- The previous injected track started at y737 because the route-only test fell
  back to the video bottom; the actual site's seek center is y791.5.

## Changes

1. Recognize an isolated, near-full-width player in a bounded viewport-sized
   ancestor, independently of the URL. Stop before body, HTML and feed roots;
   reject multiple visible videos. Existing Reels/Watch/fullscreen handling stays.
2. Accept transparent semantic range/slider hit layers. Still reject absent,
   narrow, volume/sound/brightness and ambiguous controls.
3. Hide the matching paint surface only when it is a small, text-free DIV/SPAN
   with almost identical geometry, exactly one semantic range and no other
   interactive controls or video. Hide its paint descendants too. Restore both
   input and surface on disable, recycling, detachment or loss of eligibility.
4. Keep the real slider's center as the alignment source. The reported bad case
   now produces track top y773, line/ball center y791.5. The working report stays
   at approximately y775.7; no blanket offset is applied to all players.
5. The temporary diagnostic pill is off by default. Enable **إظهار زر نسخ تشخيص
   الشريط** under compatibility settings if a new report is needed.

The 16px original emoji, three-second play-only rotation, exact build23
selection, download handoff and other existing feature code are unchanged.

## Verification

- Local JavaScript syntax and full DOM regression suite: passed.
- Numeric-only paired account report fixture: working route, non-Reels
  transparent range plus gray wrapper, restoration, volume protection and
  multiple-visible-video rejection: passed.
- Native WebView regression now exercises a non-Reels URL, transparent unlabeled
  input with matching gray wrapper and explicitly visible paint descendant,
  transformed body, stale innerHeight, unaffected volume/caption, functional
  transport and restoration. CI result pending.
- Android lint, unit tests and APK build: CI pending.

Passing reproduced geometry is not proof of the authenticated account's live DOM
or actual-device rendering. Installation verification remains necessary. Existing
background/PiP startup failures are not claimed fixed by this seek-track change.
