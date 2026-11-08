# FPRO 2.18.22 — recognize the observed homepage Share icon

## Owner evidence

The 2.18.21 V2 reports three role=button/action/component controls in the selected video's single-video owner (level5). Direct icon-font codepoints are 983928 (right), 983929 (middle), 983930 (left). The earlier owner screenshots and manually opened real Share sheet identify the left arrow as Share. Thus U+F037A/983930 is positive observed icon evidence, not a guessed position or counter. The report's mobile limitReasons=6 means tree/candidate caps; it does not prove global absence of other actions.

## Narrow change

Keep named Share behavior and viewer/Reel routes unchanged. Add a home-only icon matcher (`/` or `/home.php`) requiring:
- role=button and both mobile action/component attributes; no reaction state/long-click attributes;
- direct text U+F037A in an icon/symbol font (the report's font1/via1), with no other distinct private-use glyph;
- <=32 inspected element nodes, <=32 direct child text nodes/source and <=128 characters/source; truncated/mixed subtrees rejected;
- glyph CSS visibility through the actual action root (decorative aria-hidden is not CSS invisibility); no glyph borrowed from another nested action;
- proven selected-video ownership before any body/main/feed boundary; no foreign/no-video article, multiple-video owner or portal;
- existing visibility, video-relative bounds, unique candidate, source/identity/page/fresh Copy/cancellation gates.

Glyph results are cached only within the current explicit lookup. Only in-bounds new glyph candidates are examined; no new observer, polling or idle work. No selection by coordinate side, row index or count. No arbitrary Unicode/font/pseudo-element fallback. Known Like/Comment glyphs are not Share. Existing failure diagnostics remain available.

The real official Share click then fresh Copy link flow is retained, with internal capture -> copy=0 -> explicit Seal Intent EXTRA_TEXT. No phone clipboard read/write/restore for automated download. Ordinary manual copying and comment restrictions remain.

## Verification

Version2.18.22/code2180022/com.almekhlafi; original signing. Apply once to fresh fe8a474b25414b38819b7cf927720899c8c89705.

194 local tests, zero failures/skips. Ten new local cases cover observed icon routing, Like/Comment rejection, reordered/relocated/count-changed actions, missing font/footprint, hidden/mixed/nested/truncated glyphs, ambiguity, foreign ownership/route/portal rejection, reaction state and recycled player cancellation.

CI requires exactly 32 Android 13 tests. New full production-guard/official-copy case distinguishes all three supplied glyphs and routes the fresh selected link once with copy=0. Existing foreground clipboard sentinel/zero callbacks/manual copy case now also selects home Share by the observed glyph before exercising the real origin-checked native copy bridge. Native result and owner-account acceptance are pending until verified; controlled glyph fixtures are not owner proof.

No change to Like/fullscreen/seek/home guard, UI/themes, source resolver, native download/clipboard bridges, privacy, package/signing, external downloader or generic chooser.

Compose reference: https://developer.android.com/develop/ui/compose/documentation?hl=ar
