# Build64 — early activation checkpoint and nearest source card

## Owner report

Build63 reduced the reported displacement from 4–6 posts to two posts below the
source, but was wrong immediately when the feed reappeared. It is NOT considered
resolved. Build64 addresses reproduced algorithm defects; the exact private
account mechanism is still unproven and requires owner verification.

## Focused changes

- Capture source geometry at passive window-capture pointerdown, before site
  activation can reflow or navigate, including navigation before click dispatch.
- Reuse only a fresh same-post press snapshot (under two seconds). Movement over
  12px/pointercancel discards an uncommitted press, not an existing committed return.
- Select the nearest identifiable ancestor, rather than preferring a broad article
  around the entire feed over a nearer actual post card.
- Persist stable identity/URL aliases and rediscover the post after metadata/root
  replacement, instead of requiring the original wrapper selector.

The same bounded 16 x 150ms recovery remains; no observer, idle polling, longer
scroll lock, guessed two-post compensation or synthetic site events were added.
Real user input cancels correction. Copy/comment handling is explicitly postponed.
Native integration remains unchanged from63. The three owner-confirmed build62
prompt/site/Facebook engines remain byte-identical (hashes in accompanying JSON).
Version code64; name0.0.1.

## Verification

- **23 DOM suites PASS**, Node24.22.1/jsdom29.1.1. Added pre-click geometry shifts
  in both directions, pre-drag snapshot rejection, broad ancestor vs nearest card,
  and data-ft/tracking -> FeedUnit wrapper replacement. The pre-click case failed
  against63 with scrollY1400 instead of1800 (400px error), then passed with64.
- **Android13 native PASS**, run41209588778 on production59bc9d9.
- **First-return-frame Android13 native PASS**, run41209765709 on tests-only
  f791956. Production app sources are byte-identical to59bc9d9. Trusted pointerdown
  navigates before click, source metadata changes on return, and spacer grows
  700 ->1300 ->1500px. Real Activity BackHandler returns the post to **100px in
  the first recorded render frame and after settling**, same as its initial100px.
  Two corrections, nine attempts, one trusted cancellation; no active timer or
  retained checkpoint after cancellation. This is a synthetic WebView fixture,
  NOT a logged-in Facebook/account test or universal first-frame guarantee.
- **APK/unit/lint PASS**, run41209588824. Compatibility PASS41209588767.
- **Exact compact API35 black-box checks PASS**, job124561586683 of41209588843.
  Success-only artifact13045608118 is1,076,364 ZIP bytes (~1.08MB).
- Prompt workload Android13 PASS41209588971. Broader upgrade41209588789 remains
  **8PASS/1FAIL**, the already-deferred opaque-comment native selection problem;
  prompt first-frame hiding, trusted transitions, layout and other checks pass.
  Device matrix also has an API29 debug failure; do not call the whole matrix green.

Evidence: [native first-frame run](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41209765709)
and `FEED-RETURN-64-ANDROID.json`.

## Delivery and limits

[Compact64 APK ZIP](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/41209588843/artifacts/13045608118)
contains the small compact build, not the large debug package. Artifact metadata
and successful exact-package device job were verified through GitHub. Local ZIP
download redirected to a host blocked by sandbox network restrictions, so no
claim is made to have independently inspected its downloaded bytes here.

Unknown/removed/virtualized post identities and different permalink forms may
still prevent restoration; there is no fallback to an unrelated guessed location.
The owner must confirm returning from posts AND comments on the actual feed.
No merge to main was requested or performed.
