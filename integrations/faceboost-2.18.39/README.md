# FPRO 2.18.39 — start optional All-comments attempts at post entry

Owner38 confirms progress: opening the official sort UI changes the selection to All without tapping that radio, but entering the post still initially leaves Most relevant. This confirms the manual-open path, NOT automatic post entry or global sorting persistence. Desired behavior is applying All on entry without manually opening sort.

Found a reproducible entry gap: after the initial feed opportunity ends, a same-document post permalink click is not a comment/sort click, so38 cancels rather than starting an entry attempt. Popstate also cancels only; foregrounding never restarts.39 adds:
- Same-origin dedicated post anchors (story.php/permalink.php/owner/posts/id), including a real stationary touch tap, start the existing finite attempt after site event handlers. No forced navigation, history patch or event consumption. Download/new-tab/foreign/modified links excluded.
- Back/Forward into a dedicated post and foreground return to one start a bounded attempt; backgrounding still cancels. No feed-wide perpetual observer/polling.
- Existing exact unique opener, semantic titled radio menu, checked-state confirmation and scoped OK gates unchanged. Missing/ambiguous opener still fails closed. Metadata-only SPA entry without a permalink/event remains unproven; do NOT claim every Facebook route is covered or server global defaults changed.

294 Node cases PASS on fresh originalpin;4 focused entry regressions fail38/pass39. Six new Node cases include negative entry/OFF coverage. All58 Android13 tests PASS, retaining57 and adding post-link→opener→All→OK with no manual sort tap. All3 jobs in run42652647750 SUCCESS; fixtures are not owner-account acceptance. See VERIFICATION.md for artifacts.

Version2.18.39/code2180039. Default-OFF persisted option, OFF cancellation, diagnostics/privacy, original identity/signing and unrelated media/download/progress behavior preserved. See source-comparison.json.
Compose reference: https://developer.android.com/develop/ui/compose/documentation?hl=ar
