# Build51 — branded Reels CTA and absolute media-viewport policy

Version0.0.1 / versionCode51. Production `536972a`.

## Owner evidence versus inference

The owner's50 schema3 report proves master/filter/reference ON, Document
observation ON, document visible and CSS connected, with508 previous scans.
The current Reels CTA is NOT owned; structuralEligible=false, targetKind=rejected.
It is a124x40 semantic DIV in a399x60 fixed header, with four controls, inside
an absolute411x809 video host and a411x808 viewport. This is NOT simply a delayed
RAF or disabled observer. Prior checks=1/hidden=1 do not refer to this candidate.
The screenshot shows the exact visible Arabic CTA with the Facebook f logo,
alongside profile, Search, Reels title and Back. Hide neither that header nor the
video. Three inaccessible frames are NOT evidence that this prompt is framed.

The screenshot does not reveal whether the f is DOM text, an SVG/path or a
background. Schema3 lacks the precise structural-rejection subreason. Do not
claim the actual DOM prefix or the entire account-side root cause was proven.
Two independently reproducible50 omissions are addressed:

1. A leading brand character/text (`f فتح التطبيق`, `Facebook فتح التطبيق`,
   `فيسبوك فتح التطبيق`) fails the old exact-label test. The old reader only
   tolerates trailing branding. Now only a known edge brand may surround an
   OTHERWISE EXACT allowlisted CTA. A leading brand requires whitespace or
   an Arabic-text boundary; unrelated `fuse app` / `facebookuse app` cannot match. Specific Arabic/bidi format marks061C,
   202A–202E and2060 are ignored for this prompt test only. No generic substring
   acceptance, arbitrary icon stripping or overriding unrelated text via aria.
   Existing bounded text refusal remains. Unknown prose still fails.
2. Even the PLAIN CTA fails the full policy when this real navigation header is
   inside an absolute fullscreen video DIV rather than a semantic <main>. This
   independent geometry failure happens AFTER successful structural recognition.
   The new exception requires all of: Reels route, previously verified compact
   navigation with Search plus account/back, absolute DIV host, near-origin rect,
   width/height within90–110% of viewport, VIDEO present, and no form/input/
   textarea/select/audio/iframe/canvas/dialog/aria-modal/contenteditable content.
   Such an ancestor is traversed, NEVER hidden; only the exact CTA may hide.
   Fixed sheets, other routes, unknown headers and protected hosts still reject.

No additional observer, interval, RAF loop or larger urgent quota. Existing
49 one-guarded-urgent-check and50 current-Document/detached-node protections stay.
46 whole dedicated-bar/black-strip repair remains for install-only surfaces.
Production Android Kotlin/Manifest/early-start, Copy, website refresh, selection,
video/audio/PiP are unchanged from50. This is a deliberate, narrow safe-target
policy exception, not a claim of literally unchanged geometry rules.

## Diagnostic schema4

Manual report now adds controlled structural reason codes: missing-control,
forbidden-control, blocking-ancestor, protected-descendant, text-budget,
label-mismatch or eligible. Also boolean text-present/text-exact/aria-exact and
boolean navigation evidence per ancestor. No actual text, labels, attributes,
URLs, IDs/classes, images, storage or cookies are added or automatically uploaded.
The evidence reader runs only on explicit diagnostics, not the normal hot path.
The prior50 suite explicitly expects schema4 while retaining active-state/OFF
assertions; it is not silently treated as the old schema.

## Verification

- Eleven local DOM suites PASS, plus all three JS syntax and diff checks.
- New51 suite in standalone/fallback/reference modes: report-shaped absolute
  video host and four-control60px fixed DIV header; plain/leading/trailing brand
  labels and format-mark variant hide ONLY CTA before RAF. Account, Search,
  Back, header and video stay. Modal transition/OFF restoration remain exact.
- Negative cases retain unknown headers, non-Reels routes, fixed sheets and
  form-containing media hosts; unrelated prose never becomes a prompt.
- Actual50 assets from bb0000a FAIL the plain absolute-host case. In a separate
  relative-host variant they PASS the plain label but FAIL leading-f branding.
  This isolates the two regressions rather than attributing both to timing.
- Native Chromium fixture keeps the prior18 checks and adds2: branded CTA hides
  inside the absolute Reels video host; header/profile/Search/Back/video/host
  remain displayed.20 checks per reference mode. Native fixture URL is a Reels
  route because the policy requires that route as one of several conditions.

Fixtures do not establish account acceptance. Unknown lexical/DOM structures
can still reject; schema4 can distinguish their exact structural reason without
requesting private page text. Universal no-flash behavior is NOT promised.

## Exact CI — 536972ad3c67b28ae7be6386fbd9fa341d031ff2

- APK/unit/lint and all eleven DOM suites PASS:
  https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40555159274
- Focused Android13 all four required cases PASS, no missing/skipped cases:
  https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40555159437
  Prompt case requires20 assertions in each reference mode, not merely source
  compilation. The XML evidence gate rejects omitted/skipped/failed cases.
- Wider device matrix **2/4 jobs PASS**, not all-green:
  https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40555159318
  Compact API35 and36 PASS; debug API29 and35 fail the real-tap playback
  prerequisite in zzPictureInPictureUsesRealPlaybackAndHome. Causes unestablished;
  not dismissed as CI noise and no claim of a new audio/PiP repair.
- Hand-off is the actual compact API35 device-verified APK:
  https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40555159318/artifacts/12758040196

Full clean source ZIP includes Gradle wrapper and test media, not historical
binaries/archives, build directories, dependencies, caches or signing credentials.
The adjacent SHA256 file verifies it. Preserve login/data; never uninstall/reset
account data to bypass a signing mismatch. PR remains open, not auto-merged.
