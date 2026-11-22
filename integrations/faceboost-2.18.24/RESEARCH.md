# 2.18.24 rationale

No external resolver or library added. The owner-confirmed 2.18.23 official Share/Copy transaction is retained. Previously it set menu opacity to zero only after recognizing Copy and restored it immediately on capture; that could leave both the opening frame and asynchronous Copy success message visible.

Use a separate event-driven rendering veil established before Share, using `filter:opacity(0)` rather than `opacity:0` because the proven matcher correctly rejects CSS-invisible candidates. MutationObserver handles asynchronous insertions before the next paint, and the synchronous post-Share refresh handles immediate insertion. Physical pointer-events are disabled only on the concealed containers; official programmatic clicks and match visibility remain functional. The veil never chooses or clicks an action.

Fresh/changed Copy-success semantic statuses are narrowly matched. A bounded two-second tail catches messages created after the copy callback; manual input and app backgrounding end the tail immediately. Original property priorities are restored. Failure/source/navigation cleanup is covered by negative regressions. Exact account markup and visual flash elimination on the owner's phone remain unproven until owner testing.

Inherited source research and licenses remain recorded under 2.18.23 and earlier integrations. No additional third-party code adapted here.
