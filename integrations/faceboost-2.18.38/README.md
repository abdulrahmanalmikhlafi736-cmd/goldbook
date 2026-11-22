# FPRO 2.18.38 — bounded touch activation and retained-sheet discovery

Owner37 reports stage0/reason10/passes1–2/openers0/menus0 while the read-only snapshot sees a titled sheet and semantic Most/Newest/All radios plus OK. The latest snapshot has All checked, unlike the previous snapshot. It does NOT prove the app selected it, nor that OK was applied. Execution counters and structure alone cannot establish exact timing or actual opener ancestry.

38 fixes independently reproduced gaps, without claiming they are proven owner causes:
- A nearest unnamed metadata div no longer masks a named actionable Most/comment ancestor (maximum6 ancestors).
- A real single-finger stationary touch tap on that recognized control starts the same finite session even if Facebook never emits click. Passive capture only; no gesture interception or fabricated site touch. Drag/multitouch/cancel excluded; following compatibility click cannot reset pending checked-state verification.
- During that existing8-second session, observe class/style/accessible-name changes as well as child/checked changes, allowing an already-retained sheet to become visible without inserting DOM nodes. Same24-pass limit; no idle/perpetual observer or polling.
- Hidden retained modal roots and unrelated named feed regions cannot exhaust the32-root allowance before the visible official menu is inspected. Named comment/sort regions retained; title, unique semantic radio pair, ambiguity rejection, verified selected state and unique scoped OK remain required.

288 Node tests PASS on a fresh applied original pin. All7 focused positive regression tests fail with37 and pass38; negative drag/multitouch/cancel/OFF coverage retained. All57 Android13 tests PASS, retaining56 and adding a combined WebView touch-only metadata-child/class-reveal/hidden-root/irrelevant-region case. All3 jobs in run42647658982 SUCCESS. See VERIFICATION.md for artifact links. These are controlled fixtures, not authenticated Facebook or native trusted-touch acceptance.

Default-OFF persisted option, OFF cancellation, images/downloads/Story/Seal, media gestures, identity/signing and centered2px progress geometry preserved. Version2.18.38/code2180038; pin fe8a474b25414b38819b7cf927720899c8c89705.
Compose reference: https://developer.android.com/develop/ui/compose/documentation?hl=ar
