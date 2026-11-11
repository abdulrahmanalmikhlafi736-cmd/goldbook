# FPRO 2.18.48 — 2.18.46 visual rollback, memory-only change

Owner reports text-color flash in 2.18.47, not 2.18.46. Reconstruct from 2.18.46, not 2.18.47.

Verified fresh generated app/src/main comparison: only site-engine.js differs, by two lines pruning detached attrs owners and child journal records with detached parents before a scope batch. All other main application source/assets/resources byte-identical to 2.18.46. Build version increment only: 2.18.48 / 2180048.

No incremental scheduling, selector, palette, sheet tracking, native Material You or AMOLED de-duplication changes retained from 47. No download/gesture/CTA changes. Shared legacy code untouched.

83 official-download tests pass. Same 30-cycle memory fixture: detached attrs count at end falls from 1192 to 0; 8 connected owners remain. Original observer counts preserved (1 color / 2 color+AMOLED). Constant child undo references remain intentionally for connected-parent restoration (2 / 8); not claimed all references removed. Device visual flash and Android heaps require owner/device test. No universal leak-free claim.
