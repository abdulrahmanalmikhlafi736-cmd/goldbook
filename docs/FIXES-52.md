# Build52 — resolve the reported structural rejection, route and seek mismatch

Version0.0.1 / versionCode52. Production `c8a437a0e887e5200249f34670c6669a65185dcf`.

## What the owner's51 report proves

The filter/master/reference/Document observation and CSS are ON. Current CTA is
124x40, ariaExact=true but textExact=false, reason=label-mismatch, unowned and
structurally rejected. Its60px four-control header has navigation=true at both
relative and fixed levels. The viewport-sized absolute VIDEO host has form=true;
a real site INPUT[type=range] appears in the media report. Both route heuristics
say reels=false/watch=false despite the same video-viewer structure. These are
specific mismatches with51, not an observer/timing diagnosis or iframe claim.

The privacy report still does not expose the exact mismatching DOM text or prove
that the host contains ONLY the reported range input. We do not claim knowledge
of those private details. Actual forms/other protected descendants still reject.

## Policy corrections

1. Exact accessible app action + standalone app caption in verified navigation.
   If normal bounded control text fails but aria is an EXACT allowlisted action,
   look for a standalone caption across1–4 nonempty text chunks, ignoring SVG
   decoration/aria-hidden/script/style. Maximum64 visited text nodes and8 ancestor
   levels. A real navigation surface must contain Search and account/back evidence.
   Full policy still requires a compact navigation ancestor and fallback CTA
   width<=160px/height<=96px. Only CTA can hide, not header, slot, viewer or media.
   This deliberately changes accessible-label precedence in this NARROW context;
   it does NOT globally trust aria over unrelated prose. Existing general prose/
   budget/form/modal/descendant protections stay. Prose-only controls with a lying
   aria label and no standalone caption remain visible. Exact matching is not a
   generic phrase substring. The unrecognized SVG text in the fixture is synthetic,
   not a claim about the owner's actual logo markup.
2. Viewer policy now uses real navigation + viewport-sized near-origin absolute
   VIDEO host, NOT a particular URL path. Reels-like views on other routes can
   qualify. Non-Reels does not imply unsafe by itself. All other host bounds and
   protection checks remain.51's old route-negative test is explicitly updated
   to require hiding on a structurally verified non-Reels route, not disabled.
3. Host may contain INPUT[type=range] media controls. Forms, other input types
   (including text/password), textarea/select, modal/iframe/canvas/audio/editable
   content still block the host exception. Range INPUT is NEVER hidden by this
   policy. This is not a blanket removal of form protection.

Same observers/timers/frame quota.50 Document/detached-node fixes,49 one urgent
check/negative cache/CSS guard and46 black-strip repair remain. Production Android
Kotlin/Manifest/early-start, site refresh, Copy, selection and media/PiP/audio
behavior are unchanged. Diagnostic schema4 adds reason navigation-caption when
this narrow fallback is selected; no raw label/text/account information is added.

## Verification

- Twelve local suites PASS; JS syntax/diff checks PASS.
- New52 three-mode fixture combines the actual diagnostic conditions: unknown
  route, matching accessible action, mismatching total text with a standalone
  split caption, real navigation, viewport VIDEO host and real seek range.
  Before-RAF assertion requires only CTA hidden; viewer/video/range/Search/
  profile/Back remain; OFF and re-enable work; adding password input restores CTA.
  Prose-only lying-aria cases remain visible. Actual51 assets FAIL the new case.
- Native Chromium retains the prior20 checks and adds2 for the same combined
  structure, including a real range input and a non-Reels fixture URL.22 checks
  per reference mode; prior absolute-host and body-replacement checks remain.

No claim of access to the private account DOM or universal zero-flash behavior.
This fixes the demonstrated rejection path using exact accessible-name + caption
and independently removes route/seek constraints that contradict the report.
Phone/account acceptance is still required; protect sign-in and existing data.

## Exact CI — c8a437a0e887e5200249f34670c6669a65185dcf

- APK/unit/lint and all twelve DOM suites PASS:
  https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40559594347
- Focused Android13 all four required cases PASS, no missing/skipped cases:
  https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40559594294
  Prompt case requires22 assertions per reference mode. The XML evidence gate
  rejects skipped/missing/failed cases, not just compilation failures.
- Wider matrix **1/4 jobs PASS**, not all-green:
  https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40559594286
  Compact API35 PASS. Debug API29/35 fail real-tap playback prerequisite of PiP.
  Compact API36 fails localPagePaintsThroughRealSettingsButton with "Local HTML
  must be accessible in actual WebView". Causes unestablished; these are not
  dismissed as CI noise and no unrelated compatibility repair is claimed.
- Hand-off is the actual compact API35 device-verified APK:
  https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40559594286/artifacts/12758537752

Clean full source includes Gradle wrapper/test media but no historical APKs,
archives, build directories, dependencies, caches or credentials. SHA256 is
adjacent. No signing key; never uninstall/reset account data for signing mismatch.
