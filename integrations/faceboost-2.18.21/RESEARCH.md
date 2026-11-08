# Research boundary — FPRO 2.18.21

## Observed owner evidence

The owner confirms 2.18.20 is now good except home-feed downloading. Their screenshots show an arrow/count-only Share action and a manually opened share sheet containing Copy link. Their 2.18.20 V2 has stage=0/reason=1/share=0, no ID hits, unclassified aria-derived action names and mobile limitReasons=0. This establishes failure before Share selection, not a Seal handoff failure or a proven missing Share button.

The screenshot does not reveal a DOM glyph value, computed font family, CSS sprite identifier, action ID or accessible name. No guessed Share glyph or leftmost/third-action selection is justified. The previous invisible-direction-format correction did not resolve this owner layout.

## Actual source checked

Pinned original faceboost-review fe8a474b25414b38819b7cf927720899c8c89705, app/src/main/res/raw/scripts.js, explicitly uses U+F310F as Copy link in its Share-via integration. It is NOT evidence for a Share glyph. GitHub code searches produced no verified mapping for the owner's Share arrow; no code from search results was adapted.

## New locally authored diagnostics

Only bounded numeric public-icon evidence is added. Known icon/symbol/FB-glyph fonts can export private-use icon codepoints, not normal text/emoji. Unknown font occurrences are counted without their values. Text, font names, CSS URLs, image sources and asset identifiers are not exported. Computed pseudo-elements are examined only for the final bounded candidate set. Native formatter separately filters each numeric field and rejects non-private-use codepoints. No automatic click, clipboard write, network request, new idle observer or polling loop is added.

This is a diagnostic increment, NOT a claim that home downloading is fixed. Real glyph evidence must precede authorizing an icon-based selector. U+F310F appears in controlled tests only as an already documented public COPY-icon example.

## Preserved extraction provenance

The current-player extraction and internal Share/Copy-to-Seal path remain byte-identical to 2.18.20. Existing MIT-attributed React videoFBID adaptations retain their attribution and limits:
- Bluemaster, 833e8b365975774fca4938d09eca6f3f49a557d4: https://github.com/thuytx03/bluemaster/blob/833e8b365975774fca4938d09eca6f3f49a557d4/src/modules/auto-run/features/facebook/add-download-video-btn.feature.ts
- Useful Scripts, d7395352e30d01744c657b5684d4dec212959834: https://github.com/Useful-Scripts-Extension/useful-script/blob/d7395352e30d01744c657b5684d4dec212959834/scripts/fb_downloadWatchingVideo.js
- Bengal DM, ac78e0397f9163c04d78252331019653f035e2d0: https://github.com/tazihad/bengal-download-manager/blob/ac78e0397f9163c04d78252331019653f035e2d0/extension/src/sites/facebook/main/facebook-page.js

No global-first video, token routine, network interceptor, CDN-derived post ID or new downloader is copied. No new live-owner extraction success is asserted. Historical changes belong to their respective integration folders rather than being relabelled as new 2.18.21 work.
