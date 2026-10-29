# Build48 — bounded label reading, owned-target CSS guard, actual-page diagnosis

Version0.0.1 / versionCode48. The user reports47 still misses video Open App
controls and promotional bars can reappear. Do NOT treat previous fixture passes
as proof that their real authenticated DOM is classified correctly. No claim of
universal or imperceptible hiding is made by this build.

## Verified gaps addressed

1. `textContent` included SVG title/description and hidden decorative captions;
   visually obvious Open App controls could fail the exact-label policy. The
   shared bounded text reader now skips those decorations (not arbitrary visible
   prose), and exact labels also compare without whitespace for split-word DOM.
   A maximum64 text nodes /180 characters refuses ambiguous oversized text;
   aria-label cannot override unrelated visible content or a refused read.
2. Fallback full scanning now considers up to800 semantic controls, not just
   `a[href]`, so already-present decorated buttons are not dependent on a future
   mutation to be evaluated. No broad URL-only matching or substring hide rule.
3. CSS `[data-fpro-app-prompt],[data-fpro-reference-noapp]{display:none!important}`
   protects ONLY targets already approved by the existing guarded policy. Normal
   site inline style rewrites cannot expose those targets while the next bounded
   RAF check is pending. This is not an early catch-all rule: site inline
   !important changes, initial unknown controls, frame boundaries and classifier
   rejections still require investigation. Do not promise zero visible frames.

Build46's dedicated compact-surface policy and47's guarded navigation evidence
remain. No blind ancestor deletion, app-link CSS catch-all, overlay removal,
body-scroll unlocking, simulated clicks or new periodic scanner. Original
owned display and marker cleanup remain reversible on disable/recycling.

4. Discovery caps must not undo known ownership. A full scan previously could
   restore a verified fallback CTA once2500 unrelated controls pushed it outside
   the discovery window. Both engines now revalidate/reassert existing owned
   targets separately from discovering new candidates. An isolated regression
   first FAILed on this implementation before the correction, then PASSed in
   all three modes, including a stronger inline !important rewrite. Same-config
   reinjection remains idempotent; no larger discovery budget was introduced.

## Actual-page report instead of further guesses

Manual asset `app-prompt-report.js` returns only boolean classifications, enum
roles/tags/positions, bounds, bounded control counts, ownership, structural/full
policy result, early-injection status and iframe counts. It does NOT return raw
page/button text, SVG captions, names, IDs/classes, selectors, URLs, form values,
cookies/storage, screenshots or media bytes. At most16 candidates /8 ancestors;
general source scan bounded at2400 nodes, with at most208 priority owned/viewport-hit
entries so a visible control in a long feed is not missed by DOM order. No automatic upload or capture.

- Settings → التوافق والتشخيص → «نسخ تشخيص فتح التطبيق — دون بيانات الحساب».
- For a Reel where the settings gear is unavailable: enable the existing
  «إظهار زر نسخ تشخيص الشريط», return to the affected Reel and press
  «نسخ تشخيص الشريط». Its report now includes the same `appPrompts` section.
- Both actions copy to clipboard only. User can paste the report into chat.
  Keeping the actual failing page selected is important; a home-page report
  cannot explain a video-only control.

Native changes are only optional diagnostic callbacks/settings. No browser
lifecycle/Copy/website refresh/media/PiP/audio rewrite, new permissions, login
clearing, external service or screenshot exporter.

## Verification scope

Production source `d0dbc65238a0068efdfbae48f450add64d1cbe2a`.

- Eight local DOM suites PASS. New48 suite checks decorated/split/joined labels,
  lying aria/long-text refusal, identical shared text helper, CSS-rule ownership,
  disable cleanup, report privacy and composition of the existing video report.
- Actual47 assets fail the decorated/split regression;48 passes all three modes.
- Native fixture requires16 assertions in each reference mode. Its Reels CTA now
  has a decorative SVG title plus split Arabic spans. It also changes a hidden
  CTA's inline display without !important and requires it to remain hidden
  synchronously BEFORE observer/RAF, then requires visible restoration on OFF. It also requires re-hiding a stronger
  inline !important rewrite after2500 controls precede the already-known CTA.
  JSDOM alone is not used to claim correct browser CSS cascade.

No authenticated Facebook/Note20 reproduction exists. If the real button still
shows, capture the report above; another synthetic navigation guess is not proof
of a solution. Unknown/modal controls can remain deliberately usable rather than
reintroduce the dark-strip failure. The user request to never see any prompt is
not yet verified on their account.

Fixture note: the first native SVG fixture omitted icon dimensions and defaulted
to a150px-high SVG; the96px control guard correctly refused it. The fixture now
uses a16px icon; no oversized-control assertion or protection was weakened.

## Final CI evidence

- [Build/Lint/JVM/eight DOM suites and APKs](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40497751348): PASS on `d0dbc65`.
- [Android13 focused native gate](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40497751491): all four tests PASS/no skips, including all16 prompt checks per reference mode and real Chromium CSS-cascade validation.
- [Full matrix](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40497751331): **1/4**. Compact35 PASS. Debug29 fails the real-tap PiP playback prerequisite; debug35 fails that prerequisite and `playbackReportingTracksPageOnEveryProvider`. Compact36 fails all three tests at `Actual compact app must open`; its cause has not been established. No assertion was disabled and these are not counted green or dismissed as infrastructure failures.
- [Exact API35 device-tested compact APK48](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40497751331/artifacts/12731352649).

The optional combined-report JavaScript is tested locally for composition and
privacy. Clipboard delivery of that new combined report has not been exercised
on the user's physical device. The successful focused gate is not evidence of
all PiP/audio behavior or a fully green device matrix.
