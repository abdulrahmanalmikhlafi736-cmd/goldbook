# FPRO 2.18.28 — safe photo-download rejection diagnosis, not a speculative bypass

Owner27 screenshot shows our unsupported-image toast after Facebook photo-viewer Save. This proves a WebView download callback reaches the application and plan rejects it; it does NOT prove whether current page, target URL/host or MIME caused rejection. Do not assume it is a video or automatically accept octet-stream because of a jpg filename.

Only change: replace ambiguous rejection toast with an Activity dialog reporting fixed categories: exact first failing gate1–5, page/target host family (facebook/fbcdn/fbsbx/other/invalid), allowlisted MIME class (including octet-stream/missing/other-image), path-extension and Content-Disposition extension enums. Never display raw URL/hostname/query/ID/cookie/header/filename. No clipboard read/write. Non-Activity contexts fall back to a toast.

No acceptance gate changed. Unsupported responses remain blocked; no new fetch, polling, broad MIME acceptance or guessed image selection. Hold release, video Seal flow, clipboard privacy, Share concealment, progress/ball and developer contact stay unchanged.

Version2.18.28/code2180028/com.almekhlafi; original signing configuration. Apply once to fresh fe8a474b25414b38819b7cf927720899c8c89705.

233 local tests PASS. Native exact40-case gate retains39 including actual system PNG file save and native hold restoration; adds enum/redaction/reason-order tests with secret sentinels and ensures octet-stream still rejected. All three jobs of run42514790612 passed, including exact40 Android13 cases atd088c1b37f5e8c56683f8b24caa854ebbc4123ab. Owner needs to press the same Save row and send the diagnostic dialog screenshot. This is a diagnostic build, NOT a verified fix to the owner's Save failure.

Compose reference: https://developer.android.com/develop/ui/compose/documentation?hl=ar
