# FPRO 2.18.31 — owned Share glyph on profile/page feeds

Owner confirms30 saves photos successfully. Preserve its local image saver, reader, bounded source cache and native image handling byte-for-byte.

New owner report: route3, two document videos/one visible, selected single-video ownership relation0, Share U+F037A (983930) in a role-button/action/component row, correct old bounds and selector, no named Share. Attempt stage0/reason1 stopped before Share. Inspection finds an explicit homepage-only pathname check in glyphShare; the same observed icon therefore cannot authorize its own profile/page row. Do not infer video URL/ID or use row position.

Remove only that pathname restriction and require a Facebook hostname. Keep the same single-video owner, ancestor boundaries, visible geometry, icon-font/direct-text identity, nested/mixed/hidden icon rejection, ambiguity/recycle cancellation, fresh official Share→Copy, internal copy capture and Seal flow. No global/first-playing fallback, portal widening, polling or new observer. Diagnostic title now31 (old23 title was stale text, not installed-version evidence).

Version2.18.31/code2180031, original identity/signing. Apply once to fresh fe8a474b25414b38819b7cf927720899c8c89705.246 local tests PASS, including profile/page positive and negative ownership cases. The previous30 Share matcher fails the profile/page regression. Exact47 Android13 native gate PASS (retains45 and adds two profile/page shape cases); all three jobs SUCCESS on42539827462. See VERIFICATION.md. Owner-account confirmation remains pending.

Reference: https://developer.android.com/develop/ui/compose/documentation?hl=ar . See RESEARCH.md and VERIFICATION.md for evidence boundaries.

First CI attempt42538418079: new profile/page cases passed, but three existing foreground/clipboard tests failed (two window-focus timeouts, one null clipboard read). No APK candidate promoted. Failed-only rerun was rejected by GitHub. Test-only recovery now explicitly wakes/dismisses keyguard and waits for actual window focus; all assertions and exact47 gate remain. Production behavior unchanged.
