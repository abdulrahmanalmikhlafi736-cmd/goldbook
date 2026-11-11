# FPRO 2.18.40 — bounded intended-entry URL handoff

Owner39 diagnostic: stage0/reason2/passes2, no menu/opener/choice counts; both captured routes3 and no rows. Reason2 proves the controller aborted on URL inequality. It does NOT establish which transition it was, whether it preceded post entry or happened while opening settings, nor the actual post URL/layout. Do not call the reproduced scenario the proven owner root cause.

40 fixes reproducible delayed-entry cancellation:
- Carry a recognized same-origin post anchor's destination into the existing finite attempt. If the site changes URL after its first passes, accept exactly that post before any opener/menu action. Do not act on old post controls while waiting for a different target.
- A recognized comment/sort entry can hand off once from a non-post route to a supported same-origin dedicated post. Never carry a selected radio into a different post, settings, feed or foreign origin.
- Same canonical post may change tracking query/hash without cancelling checked-state verification. Canonical story/permalink identity includes story_fbid and owner id; post-path identity is exact normalized path. IDs stay internal, never diagnostic exports. No guessed post URL or forced navigation.
- Observe documentElement for the same finite session so a replaced body does not orphan its observer. Same8-second24-pass deadline; no renewal, history patch, polling or idle observer. OFF cancels everything; strict opener/radio/confirmation gates untouched.

302 Node tests PASS on fresh applied source. Four positive regressions fail39/pass40. All59 Android13 tests PASS, retaining58 and adding delayed post URL + body replacement → opener/All/OK. All3 CI jobs in run42656223722 SUCCESS. See VERIFICATION.md for artifacts. Controlled fixtures are not owner success.

Version2.18.40/code2180040, original pin fe8a474b25414b38819b7cf927720899c8c89705. Default-OFF persisted toggle, media/progress/downloads/privacy/identity/signing retained. Compose reference: https://developer.android.com/develop/ui/compose/documentation?hl=ar
