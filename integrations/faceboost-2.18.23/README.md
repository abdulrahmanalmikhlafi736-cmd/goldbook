# FPRO 2.18.23 — Copy-row matching after owner-confirmed Share opening

## Observed progress / boundary

Owner confirms 2.18.22 now opens the real homepage Share sheet. Its V2 reaches stage2/share1 but reason4/copy0: more than one fresh Copy match, not Share-not-found or a Seal failure. Screenshot shows the real Copy link and injected Share-via rows. The full actual DOM is not exported, so do not claim to know exactly which duplicate nodes were present.

Source inspection demonstrates a real false-positive class: the old `isCopy` accepted any candidate containing a descendant span with U+F310F. Therefore an actionable sheet/backdrop ancestor also became Copy when it merely contained the real Copy row. The pinned original app's Share-via integration instead obtains the nearest role-button for that glyph. A controlled full-sheet regression fails with the unchanged 2.18.22 code (zero Copy calls) and passes with this repair.

## Narrow changes

- Glyph evidence belongs to its nearest role-button within a presentation/dialog/menu sheet, following the pinned original's existing Copy-row convention. Metadata on the icon is not a second row. Outside known menu structures use nearest existing actionable candidate, not arbitrary ancestors.
- Do not give aggregate wrappers a Copy name solely from inherited descendant text when they contain other controls. Explicit own aria/title/labelledby evidence and existing canonical same-owner dedup remain.
- Copy visibility checks ancestor CSS through a bounded32-depth chain; invisible duplicate panels do not create false ambiguity. Share/video visibility and accepted homepage glyph matching are unchanged.
- Transaction-only transitionend/animationend listeners recheck after CSS sheet fades, through the existing coalesced rAF, <=80-scan/8-second budget. No polling or idle listeners; normal stop/cancel cleans them up.
- Two genuinely separate fresh Copy actions still fail with reason4, never choose first. Pre-opened sheets, Share-via clones, source/identity/page changes and user cancellation remain protected.
- Numeric attempt fields: copyMatches cap64; copyNamed/copyGlyphs/copyNested cap32, measured on at most the first32 matches. No labels, URLs or action IDs; native independently allowlists/caps them.

## Preservation / verification

Version2.18.23/code2180023/com.almekhlafi, original signing. Apply once to fresh fe8a474b25414b38819b7cf927720899c8c89705.

204 local tests passed, zero failures/skips. Ten added cases cover full actionable wrappers, glyph-only rows, inherited text, invisible duplicate, genuine ambiguity, preexisting sheet, background video hidden by its own modal, counter allowlist, icon metadata and CSS fade completion.

CI requires exactly33 Android13 tests. New case runs the accepted home glyph -> full sheet/backdrop/icon metadata -> real Copy hook -> fresh current URL/copy0, asserts no wrong row clicks, and exercises native counter caps/redaction. Existing foreground sentinel test now uses the same realistic wrapped Copy menu and real native pre-write interception, requiring unchanged clipboard/zero callbacks and a subsequent successful manual copy. Native outcome and owner acceptance pending until verified.

Internal capture/Seal Intent handoff remains unchanged: no system clipboard read/write/restore for automated links. No source/CDN guessing, global-first selection, chooser, internal downloader, unrelated Like/fullscreen/seek/CTA/theme/home-guard changes.

Compose reference: https://developer.android.com/develop/ui/compose/documentation?hl=ar
