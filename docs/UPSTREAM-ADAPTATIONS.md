# Build57 — Materialbook / Nobook adaptations

FPRO remains GPL-3.0; see the root [LICENSE](../LICENSE). This document credits
the upstream projects whose selectors and feature designs informed the modified
FPRO implementation. This is NOT a wholesale import of either app or its scripts.
Upstream project/contributor attribution is retained here; no exclusive FPRO
ownership of the upstream work is claimed.

## Pinned sources inspected

- [Materialbook, eepiemi and contributors, f63919d](https://github.com/eepiemi/Materialbook/tree/f63919dae54dd91debcfea1ea5c3d2ab1793c34e),
  [GPLv3 LICENSE](https://github.com/eepiemi/Materialbook/blob/f63919dae54dd91debcfea1ea5c3d2ab1793c34e/LICENSE).
- [Nobook, ycngmn and contributors, 608296b](https://github.com/ycngmn/Nobook/tree/608296b441d3b98beb15f8504d4768cc89b7566c),
  [GPLv3 LICENSE](https://github.com/ycngmn/Nobook/blob/608296b441d3b98beb15f8504d4768cc89b7566c/LICENSE).
- These are researched source revisions, NOT a claim that both released APKs
  contain the same code. Nobook's latest release inspected was v0.1.1,
  a936731f1751042992da45503e562e6f7bb3369a; its downloader lacks the later
  icon-based Open App detector. Upstream APKs were not executed in this work.

Source files below are under `app/src/main/res/raw/` in both pinned trees.

| Feature / source files | FPRO adaptation | Deliberately NOT imported |
| --- | --- | --- |
| Material You — `material_you.js` and native palette handling | Android12+ native Material3 primary is serialized as validated `systemAccent`; existing FPRO color engines use it only with automatic color + dynamic enabled. Manual/natural colors still win. Both early and finished-page injection use the same config helper. | New JavaScript palette bridge; broad rewriting of every blue/color declaration; forcing automatic color over named themes. |
| AMOLED — `amoled_black.js` | Existing dark CSS/tokens retained. Additionally convert five exact opaque dark inline surface colors on structural containers to black with reversible, separately scoped ownership. No inline image/gradient rewriting. | Rewriting arbitrary stylesheet text or every dark element; recoloring image/video pixels. |
| Paid ads — `adblock.js` | Add `.sponsored_ad` and `article[data-ft*="sponsored_ad"]` to existing ad detection. Existing sponsored labels/data markers retained. | Classifying all gray text (`#8a8d91`) as ads; desktop obfuscated-class-only sweeping. |
| Suggested / people / groups — `hide_suggested.js`, `hide_pymk.js`, `hide_groups.js` | Existing exact localized label detection can target guarded tracked containers. Added bounded heading/TextArea-label checks on tracked cards, including on insertions. Main/feed/navigation/form/modal hosts and wrappers containing nested tracked cards/articles are rejected. | Bullet-only detection; arbitrary next-sibling deletion; hiding every horizontal scroller/tracked card; hiding the last search result or group card without identity evidence. |
| Stories — `hide_stories.js` | Add home-only MContainer/data-srat43 structural tray cue, requiring a stories link and no nested article/form/input. Reuse existing story-block removal, including its spacing cleanup. | Blindly hiding every data-srat43 container anywhere. |
| Reels — `hide_reels.js` | Both mobile private-use glyphs are cues ONLY when inside the expected native-text shape, a guarded tracked card and an explicit reel/reels link. Existing label/permalink handling retained. | Glyph alone as identity; generic desktop class combinations that may match unrelated media. |
| Sticky navigation — `sticky_navbar.js` | Recognize upstream header shape only with Facebook + Search, and matching home/feed tablist; use `position:sticky`, measured bounded header offset, reversible markers/offset. Existing semantic banner support retained. | Fixed global body height/overflow/padding; rewriting all scrollers/margins; moving/removing search/account controls. |
| Open App — `scripts.js`, `download_content.js` | Probe first `.bottom.fixed-container[data-actual-height]` without keyboard-shift attribute; positive numeric height <80 is only a discovery cue. Existing full CTA/ancestor policy must still accept the target. Bounded fallback control discovery; reference engine retains its current policy. | Hiding every short fixed footer, generic app intent link or arbitrary ancestor; assuming glyph/metadata proves the owner's exact banner. |

## Architecture / scope / cost

The user's choice was to **adapt existing engines**, not replace them. Existing
settings, original12 color choices, selection behavior, native site refresh,
account/search, video/Seal/PiP and the build46 dark-strip safeguards remain.
The existing observer/full scan is reused; no extra observer, timer, bridge,
network blocker, external ad-filter subscription or native refresh controller.
“Ad blocking” here is DOM hiding, not network interception or a guarantee about
all ads, especially inline video advertising.

The extra candidate walk shares a384-node fast budget across at most4 roots,
or2400-node full budget on the body. Per tracked-card label walk is96 nodes,
at most24 matching headings. Descendant guard/querySelector calls and reading
text/geometry still have real native DOM cost; this is NOT a hard wall-clock
bound or zero-overhead claim. Footer probe returns only first match per root:
a rejected first match or roots outside the scope cap can delay/miss detection.
Existing deferred scans remain; held pointer/touch/selection defers added non-CTA work, while footer discovery remains urgent. Sticky recognition/measurement is full-pass only.

Inline adapted surface/offset writes use the existing reversible style-ownership
helper with a separate map, so normal accent resets do not erase AMOLED/sticky
values. Full-pass restoration/reclassification and settings/master-OFF restore
only still-owned declarations, preserving intervening site edits.

Facebook layouts are private, dynamic and vary by account/language/provider.
Unrecognized variants stay visible rather than risking whole-page hiding.
Filters are not content understanding: exact marker/heading cues can change.
No claim that all upstream behavior was copied or all account layouts work.

## Verification

- `tools/test-adaptations57.cjs`, automatically included by the test runner:
  both reference/fallback modes; ads, exact suggestions/people/groups, stories,
  reels; ordinary/nested-post/form and missing-reel-link protection; recycle/OFF;
  dynamic/manual/disabled colors; AMOLED and photo protection; combined
  AMOLED+accent/repeated scans; sticky offsets with accent enabled and restoration;
  late unlabelled Arabic CTA after1000 generic nodes using the upstream footer shape.
- `SiteAdaptationsRegressionTest`: Android WebView layout/computed CSS fixture;
  reads the actual native serialized Android12+ palette, tests combined filters,
  AMOLED, protected gradient/ordinary page, dynamic recoloring, sticky48px offset
  and master-OFF restoration. Test restores the dynamic preference afterward.
- Existing56 real trusted-touch transition/prompt/bridge/renderer fixtures retained.
  See [FIXES-57](FIXES-57.md) for actual run outcomes, not merely planned checks.

**Known owner issue remains unverified:** after56 the owner still saw Open App
while pressing controls. The new footer discovery cue is relevant evidence, not
proof that this private-account case is fixed, and no universal zero-flash claim.

Native UI reference required by the project:
[official Compose documentation (Arabic)](https://developer.android.com/develop/ui/compose/documentation?hl=ar).
Material3 dynamic scheme APIs already used by FPRO supply the palette; no new UI
framework or dependency was introduced.
