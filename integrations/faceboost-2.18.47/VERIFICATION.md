# 2.18.47 scoped color lifecycle improvements

- Single active page accent owner: raw Material You page injection removed; native Compose Material You unchanged.
- AMOLED remains exclusively the original Faceboost raw option. Upstream scope no longer mounts its duplicate.
- Incremental accent roots, zero-delay coalescing, self-style suppression, content-aware stylesheet WeakMap. Existing color regex/rules/palette retained.
- Detached element restoration journal owners pruned before batches; child undo records removed only when their parent is detached. Connected-parent undo history preserved.
- No changes to downloads/StoryDownloads/image save/gestures/PiP/CTA. Old disabled shared color routines remain isolated rather than deleting entire shared files. Historical source migrations remain build-time only.

Local tests: 83 official-download tests + 2 new accent lifecycle tests pass. New tests check added elements, same-style-node external replacement, OFF restoration, external non-blue style preservation, owner wiring and settled timers.

Same memory46 harness, 30 cycles per scenario: active-color journal now holds 8 connected elements, 0 detached elements at cycle30 (baseline 1200 entries / 1192 detached). Factory observers stable; repeated evaluation no duplicates. AMOLED scenario in this harness only checks the scoped engine: original native raw AMOLED isn't loaded there and still needs Android/device testing.

No authenticated Facebook/device heap certification. This does not assert Like-long-press/pull-refresh fixed or no other memory problems. Remaining disabled legacy shared code isn't claimed fully removed.
