# FPRO 2.18.22 — observed homepage Share icon repair

App commit f2ef792f91821d2ed8520ddbb128573b441a1635.

All three CI jobs succeeded (194 local / exactly32 Android13 tests):
https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42493654152

APK: https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42493654152/artifacts/13623071669

Native evidence: https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42493654152/artifacts/13622777548

Build inputs containing clean inner FPRO-2.18.22-source.tar.gz: https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42493654152/artifacts/13622712716

Candidate ZIP contains APK/SHA256SUMS/TAP. Archive metadata in evidence is not APK bytes/SHA; no independent APK extraction/signature validation is claimed. Outer build-input ZIP includes build products; only its inner tar is represented as clean source. Identity com.almekhlafi / version2.18.22 / code2180022; original signing configuration unchanged.

## Why this is an actual routing repair, not another diagnostic-only revision

Owner 2.18.21 report supplies public icon evidence absent in earlier reports: the three owned action controls contain direct icon-font values 983928, 983929, 983930. Correspondence with the prior screenshot and manually opened real Share sheet identifies 983930/U+F037A as Share; 983928/983929 are the separate Like/Comment controls. The capped diagnostic does not prove the whole page has no other actions.

Runtime now recognizes exactly this direct-text/icon-font glyph on `/` or `/home.php`, with the observed role/action/component footprint, selected-video ownership, bounds, visibility and uniqueness. It does NOT choose leftmost/third action, inspect the count, invent an accessible name, use a guessed glyph or allow generic Send. Pseudo-only, unknown font, mixed/truncated/foreign nested icon evidence is rejected. Optional unreported action-state/long-click metadata does not override the positive observed icon identity. No global portal fallback is added.

Once the actual action is found, the unchanged fresh official Share/Copy transaction captures the real link internally, routes copy=0 and sends Intent EXTRA_TEXT to configured Seal. No CDN/ID guess, chooser, internal downloader, system clipboard read/write/restore or Native copied toast is added. Manual copy and comment restrictions remain. Lookup-only WeakMap and small node/character bounds add no idle polling/observer.

## Tests and preservation

Ten new local cases: observed-icon routing; Like/Comment rejection; reordered/repositioned/count-changed actions; wrong font/footprint; hidden/mixed/nested/truncated evidence; ambiguity; foreign ownership; other-route/portal rejection; optional metadata; recycled-player cancellation.

New native case runs production home guard and official-copy assets with all three reported glyphs and asserts only Share/Copy run, with the exact fresh current URL/copy0. Existing foreground sentinel test now selects the home Share glyph and exercises real origin-checked native copy interception: clipboard unchanged/zero callbacks during automatic capture and handoff, followed by successful ordinary manual copying. All prior cases remain required; exact32 gate passed.

Fresh generated-source comparison against 2.18.21: five changed paths. Only official-download.js changes production selection; other paths are version/code, version-only surface/formatter text, and Android tests. Thirteen critical paths are byte-identical, including all source/identity resolvers, native download/clipboard bridges, raw scripts, home guard, manifest and diagnostics. No Like/fullscreen/seek/theme/home-prevention/identity/signing rewrite. Gradle signing file difference is version/code only.

**Owner account acceptance is pending.** Fixtures cannot prove Facebook's live event/menu behavior or Seal UI on the owner's device. Deliver as a verified candidate implementing the observed repair, ask the owner to press the circular download action directly on a homepage video without manually opening Share first. If it still fails, use the fresh 2.18.22 stage/reason report; do not claim 100% success before that test.

Post-CI README/evidence edits are documentation-only and do not change generated application inputs.
