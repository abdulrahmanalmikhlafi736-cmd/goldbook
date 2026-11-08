# FPRO 2.18.21 — focused home-feed icon diagnostics, not a claimed fix

Owner confirmed 2.18.20 is now good except downloads from the home feed. Screenshots show an icon/count-only Share action; manual Share opens a real sheet containing Copy link. The fresh V2 has stage=0/reason=1/share=0, label=0 on all nearby aria-labelled actions, local ownerDepth=8 and mobile limitReasons=0. Direction formatting did not solve this layout. The screenshots do NOT establish the actual DOM glyph, accessible name, public sprite asset or CSS font; do not fabricate one or select the leftmost/third button.

## Only changed behavior

On the existing explicit download-failure diagnostic, inspect the final <=12 candidate actions. At most 32 element nodes per action, 128 characters per source, six unique glyph records. Other nested actions are excluded. Text nodes and ::before/::after can supply private-use icon codepoints only when the computed font belongs to an icon/symbol/FB-glyph category. No normal characters, emoji, arbitrary/system font glyph values, text, font names, CSS URLs or asset URLs are exported. Unknown-font PUA occurrences are counted only. This is on demand, not a new observer/poll loop.

Additional numeric V2 fields:
- nameShape: 0 empty, 1 numeric count/punctuation only, 2 other <=100 characters, 3 >100.
- ariaKind/titleKind: same existing label classes (0 unknown/1 exact Share/2 broad Share/3 Copy).
- icons.glyphs: up to six {code, font, via}; code is a Unicode private-use icon value, not an account/video ID; font 1 icon/symbol, 2 FB glyph; via 1 direct text, 2 before, 3 after.
- icons.unknown: capped count of private-use characters in unknown font categories; their values are NOT exported.
- icons.kinds bitset: 1 private-use character, 2 img, 4 svg, 8 CSS background image, 16 CSS mask, 32 canvas. No image source/value leaves the page.
- icons.limited: node/glyph budget reached.

Native formatter independently reconstructs this allowlist, excludes normal Unicode/codepoints, rejects >6 glyph records, and discards added raw keys. Explicit report copying remains manual. No automatic clipboard or network writes.

## Preservation and verification

Version 2.18.21 / 2180021, com.almekhlafi, original signing. Apply once to fresh original fe8a474b25414b38819b7cf927720899c8c89705. Official/current-player extraction, Share/Copy targeting, internal capture and Seal Intent handoff are unchanged from owner-accepted 2.18.20. No icon is yet authorized as Share, no position/count fallback is introduced, and the home-feed issue remains unresolved pending real icon evidence. Viewer/Reel downloads stay enabled. All accepted UI/gesture/home prevention and manual-copy behavior remain.

184 local tests / 0 failures / 0 skips. CI requires exactly 31 Android 13 tests, including original untouched-clipboard/manual-copy and new native icon sanitizer evidence. CI run 42490384756 passed all three jobs and the exact 31-test Android gate. Owner glyph evidence/home-feed resolution remain pending. U+F310F in fixtures is the original upstream's known COPY glyph, used solely as a controlled public-icon example, NEVER assumed to be the home Share glyph.

User next step after verified installation: press the download button for a home-feed video, explicitly copy the resulting new V2 report and return it. It identifies the public icon code/font category corresponding to the shown action, without opening unknown actions automatically.

Compose reference: https://developer.android.com/develop/ui/compose/documentation?hl=ar
