# FPRO 2.18.44 — native committed-navigation entry signal

Owner43 screenshot still Most; current/previous scanned0/fallbacks0/reason2 means those recorded attempts stopped on URL inequality without invoking post button discovery. It does not establish that43 matching itself failed. Latest opener result6/tap2 is a discarded generic swipe, not a verified opener; its textMost0 does not characterize the sorting button.

44 connects the EXISTING BlockingWebViewClient native doUpdateVisitedHistory and onPageFinished callbacks to the enabled comment controller. Superclass navigation/blocking behavior retained; no replacement client, history monkey-patch, site event synthesis, polling or idle observer.

The enabled-per-WebView weak map excludes other/off WebViews. Native validates HTTPS/Facebook and quotes URL safely; JS checks same origin, canonical supported post AND actual current post identity before starting. One history and one finished opportunity per post entry; duplicate/tracking callbacks cannot repeatedly restart. Active same-post selection is not reset by page finish. Non-post committed signals clear entry dedup; OFF cancels and resets. Finished callback bootstraps packaged scripts for old WebViews lacking document-start injection. Same8sec24-pass bound per opportunity; a finished-page event can recover an expired loading opportunity once.

Diagnostics add bounded nativeSeen/nativeStarts/nativePhase counters (1 history,2 finished), without URLs or post IDs.43 strict visible-text/metadata/composer/unique-radio/OK gates untouched. Native signal alone is never authorization to click an unlabeled control.

328 Node tests PASS fresh source;3 positive recovery regressions fail with43 (missing native method treated as no-op) and pass44. Five new controller tests plus one wiring test cover unrecognized delayed entry, expired load/finished recovery, duplicates, in-flight choice safety, origin/post/OFF guards, return and production-client wiring. All63 Android13 cases PASS, retaining62 and adding real Chromium pushState→native visited callback→PRODUCTION BlockingWebViewClient→helper→full opaque-opener/All/OK, without sort tap, anchor, synthetic popstate or direct helper invocation. All3 jobs in final run42692528506 SUCCESS. See VERIFICATION.md for artifacts. Owner automatic success still unconfirmed.

Version2.18.44/code2180044. Persisted default-OFF option and unrelated media/progress/download/blocking/audio/identity/signing preserved.
Compose reference: https://developer.android.com/develop/ui/compose/documentation?hl=ar
