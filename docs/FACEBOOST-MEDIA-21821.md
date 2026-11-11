# FPRO 2.18.21 — verified icon-diagnostic candidate, homepage not yet fixed

App commit 0f16a2b359656dd1834c48ff967b8ca007cd55e2. All three CI jobs succeeded, with 184 local tests and exactly 31 Android 13 tests:
https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42490384756

APK: https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42490384756/artifacts/13621875948

Android evidence: https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42490384756/artifacts/13621497412

Build inputs containing clean inner FPRO-2.18.21-source.tar.gz: https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42490384756/artifacts/13621089645

Package com.almekhlafi, version 2.18.21/code2180021, unchanged signing configuration. Candidate ZIP includes APK/SHA256SUMS/TAP. Artifact digest/size in evidence are ZIP metadata, not APK size/SHA; no independent APK bytes/signature extraction is claimed. Outer build-input ZIP includes build products; only its inner source tar is represented as clean full source.

## Owner evidence, not a guessed repair

Owner says 2.18.20 is good except home downloads. Screenshots show icon/count Share and a manually opened real sheet with Copy link. The new V2 still fails before Share selection (stage0/reason1/share0), and has mobile limitReasons0. Direction normalization did not resolve this layout. No actual DOM glyph/font/accessible name is disclosed, so image position/count is not enough to authorize a selector.

2.18.21 therefore adds bounded numeric icon evidence to the existing explicit failure report, NOT a home-download fix. Final <=12 actions only; <=32 nodes/action; <=6 icon records; known icon/FB-glyph font categories and Unicode private-use codepoints only. Normal text, emoji, unknown font character values, font names, CSS/image URLs and asset IDs are not exported. Unknown-font counts/render-kind flags and numeric name categories help explain missing evidence. Native sanitizer independently drops non-icon codepoints and extra keys. No new automatic click, clipboard mutation/read/restore, network request, idle observer or polling. Controlled tests use known Copy glyph U+F310F, never assume that it means Share.

## Preservation

Fresh original overlays compared: only five generated source paths differ from 2.18.20: version/code, media-surface version comment, new diagnostic asset, native diagnostic sanitizer and Android test. Thirteen critical files are byte-identical, including all official/current-player extraction, internal copy capture, native clipboard bridge, download/Seal handoff, raw scripts, home guard and manifest. No appearance/Like/fullscreen/seek/manual-copy/comment-restriction rewrite. The already accepted viewer/Reel downloads remain active.

Native test31 exercises real WebView icon evidence and native rejection of normal-character codepoints/raw secrets. Original clipboard sentinel/zero callbacks/real manual copy test and all prior 30 cases remain required and passed. No owner-account test is claimed for 2.18.21.

## Next owner step

Install APK above. Close the website Share sheet first. Press the circular download action for a homepage video; explicitly copy the newly generated **2.18.21** V2 report and return it. It now has candidate `icons`/name-shape evidence absent in earlier reports. Do not tell the owner the homepage problem is solved until a targeted selector is supported and actually tested.

README/RESEARCH final edits after CI are documentation only; apply.py does not consume them, and the packaged app inputs are unchanged.
