# Build58 — actual upstream implementation replacement

The owner reported57 did NOT fix their issue and explicitly changed the decision:
import Materialbook/Nobook implementations instead of adapting FPRO classifiers.
This supersedes the build57 adaptation choice, NOT the remaining app requirements.

## Sources / licensing

GPL-3.0, root LICENSE plus assets/upstream/LICENSE. Credits: eepiemi/Materialbook
and its contributors; ycngmn/Nobook and its contributors. The extracted downloader
Open App glyph helper was originally authored by @YeiversonYurgaky.

Pinned Materialbook f63919dae54dd91debcfea1ea5c3d2ab1793c34e:
https://github.com/eepiemi/Materialbook/tree/f63919dae54dd91debcfea1ea5c3d2ab1793c34e/app/src/main/res/raw
Pinned Nobook608296b441d3b98beb15f8504d4768cc89b7566c:
https://github.com/ycngmn/Nobook/tree/608296b441d3b98beb15f8504d4768cc89b7566c/app/src/main/res/raw

Unmodified vendor files in assets/upstream: material_you, amoled_black, adblock,
hide_suggested, hide_stories, hide_pymk, hide_groups, hide_reels, sticky_navbar.
manifest.json contains source SHA256 and byte-identity comparison with Nobook.
Shared suggestion/stories/people/groups/sticky implementations match both sources;
Materialbook supplies MaterialYou and expanded AMOLED/ad/Reels behavior. Nobook's
pinned tree does not have material_you.js; do not attribute that file to Nobook.
Bottom-banner code is extracted from scripts.js; glyph helper/context selectors
are extracted from download_content.js, without importing its downloader or UI.
No upstream author ownership is removed or claimed exclusively by FPRO.

## Not build57's engine

Preferences serializes siteEngine=upstream in production. MainActivity loads
site-engine.js before facebook.js, at both existing injection stages. The raw
configuration goes to the imported engine; legacyConfig masks ALL overlapping
legacy coloring/AMOLED/hiding/CTA/sticky flags and disables FproColor/FproNoapp.
The old implementations remain in the file for historical regression fixtures,
but they do NOT run for these production features. There is no fallback that
silently re-enables them. Ordinary dark mode (without AMOLED), direction, native
selection, Seal/current media, playback/PiP/audio, fullscreen and refresh behavior
remain separate. No native touch/debug/security/permission changes.

The existing referenceEngine preference now controls imported MaterialYou color;
it does not switch back to our old engine. Experimental color variables remain
optional extra palette tokens, not the old experimental classifier. Natural and
manual color choices are retained. Dynamic supplies native primary/onPrimary;
the MaterialYouBridge API is a LOCAL JavaScript facade, not a new Android bridge.

## Integration changes, not replacement classifiers

Generate assets/site-engine.js using `node tools/build-site-engine.cjs`.
The raw vendor sources are preserved. Build-time edits:
- Scope upstream undeclared size/svg variables; wrap asynchronous desktop sticky
  continuation so its writes and observers belong to the active lifecycle.
- Journal AMOLED CSSOM writes for restoration.
- Guard upstream adblock's null container dereference, retaining its selectors.
- Mutation-boundary hide/remove protection for page/navigation/FPRO hosts, search and form/modal controls; imported matching logic otherwise retained, not replaced by our old classifier.
- Arabic translations of the two injected Reels-ad placeholder strings.
- Run the unchanged bottom-bar classifier once initially as well as its original
  mutation observer, rather than waiting for the first unrelated DOM change.
- Run extracted glyph helper with original URL/indicator/feed context check.

The lifecycle tracks vendor-created Mutation/IntersectionObservers and timers;
stops them before option/master changes; journals inline properties/attributes,
CSSOM and node replacement/removal. OFF restores original node instances/listeners
where still owned and retains unrelated inline site edits. Document queries exclude
FPRO's own media/selection/progress nodes and styles. Body replacement/navigation
remounts enabled features. No prototype mutation, eval/new Function or release
WebView debugging. Upstream factories are bundled as ordinary static JavaScript.

## Important risks — intentional broader behavior

Unlike57, actual upstream broad gray-span, bullet, next-sibling, last search group,
all-hscroller, class/glyph and short-footer heuristics now determine matches.
They can hide ordinary similar content or search suggestions. Page/navigation hosts, FPRO tools and form/search/modal controls are rejected at the hide/remove boundary; this is not a claim to recognize every private account control. Sticky
uses upstream FIXED positioning/body/scroller adjustments, not our sticky design.
The imported Reels-ad module may replace contents with a localized placeholder and
scroll past blocked ads. These behaviors are not falsely described as guarded57.
No claim they identify the owner's private CTA or guarantee zero compositor flash.
Settings/master OFF is the escape hatch. Third-party DOM recycling/site edits can
prevent conservative restoration; full navigation rebuilds the site's own content.
The engine has multiple original vendor observers/full walks, NOT one bounded
384-node FPRO engine. No unsupported performance/latency promise.

## Verification

- `test-replacement58.cjs` exercises actual source selectors unavailable to the
  old engine, no dual matching, OFF observer shutdown, identity/listener restoration,
  named/dynamic colors, FPRO-tool exclusion, unrelated site edits and upstream fixed
  navbar/scroller offsets, and the unlabelled short footer classifier.
- All prior17 DOM suites retained; final18 suites pass locally on Node24.22.1.
- New SiteReplacementRegressionTest uses actual WebView/native palette and combined
  imported features, checks17 booleans including original-selector matches, legacy
  matcher inactivity, AMOLED, fixed navigation, native controls and OFF restoration.
  Prior six Android13 required cases retained; seven are now required.
- Native build/emulator results must be recorded after execution. Local DOM passes
  alone are NOT an APK build, real Facebook account acceptance or performance proof.

Official native UI reference: https://developer.android.com/develop/ui/compose/documentation?hl=ar
