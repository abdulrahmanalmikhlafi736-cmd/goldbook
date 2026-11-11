# FPRO 🔥 2.18.18 — targeted mobile Share diagnostics, schema V2

Owner supplied two real V1 reports: no React props/fibers/known ID hits in the examined hosts, mobile mcomponent/action attributes present; Reel has one broad Share-label match; other sample has a limit flag. Matching playback sources do not explain a source-transition rejection at those instants. These observations do NOT establish absence of React/IDs across the entire page, which limit fired, or ownership of the Share-like match.

This is a second DIAGNOSTIC build, not a claimed extraction fix. Video button still opens a local native Copy report dialog and does not click site controls, invoke official Share/Copy, send to Seal, automatically copy or upload. It adds structural candidate details needed to explain the old selector's rejection without choosing a target blindly.

## V2 search

- First walk the selected video's unique owning container, bounded at 12 ancestors / 1,800 nodes. Stop at shared video/feed/main/body boundaries or article. This avoids the old first-500-document-nodes problem on long feeds.
- Independently hit-test a fixed viewport grid (279 points), at most eight hit-stack elements and six ancestors each. This can find portal rails outside the owner. Finite sampling is NOT proof an unsampled control is absent or obscured.
- Exclude FPRO-owned tools, classify fixed Share/Copy labels without exporting them, map label nodes to their nearest action/button/link ancestor, and deduplicate by that node. Also inventory small nearby unlabelled action nodes at lower priority, without treating them as Share. Report up to 12 candidates, never click them.
- Classify current/foreign/shared/unproven ownership; record normalized geometry, whether the old selector/label/bounds would accept it, action ancestry, and discovery channel. No raw text, identifiers, URLs, arbitrary keys/classes, action values or icon paths.
- Compare current visibility with the old visibility rule, including ancestor opacity. Record the reason for new scan limits separately from V1's ambiguous aggregate flag.

Native formatter accepts V1/V2, independently allowlists all numeric candidate fields and geometry, rejects excessive arrays/payloads and discards unknown strings. Existing privacy and explicit-copy behavior remain. No new observer, timer, network hook, account-storage access or durable report storage.

## V2 developer decoding

V1 metadata schema stays unchanged; see prior version README for its field/path enums. `legacyLimited` preserves V1's aggregate flag without guessing its cause. `mobile` adds:

- stop: 0 natural end, 1 root/feed/main boundary, 2 shared/mismatched-video boundary, 3 article, 4 ancestor-depth limit.
- ownerDepth: unique-owner ancestor count. visibleVideos: ancestor-aware visibility; oldVisibleVideos: prior visibility rule. Neither is a playback/identity selector. selectedVisible: current video visibility.
- localVisited / pointChecks: actual bounded work. limitReasons bitmask: 2 local tree budget, 4 candidate/detail cap, 8 owner depth, 16 hit-test API unavailable, 32 visible-player count cap. V1 limit is separate.
- video / candidate x,y,w,h: thousandths of viewport width/height; x/y clamped -2000..3000, sizes 0..3000. No screenshots/pixels/images are retained.
- candidates label: 0 unlabelled small nearby action (NOT identified as Share), 1 exact Share-like label, 2 broad Share/Send prefix, 3 Copy link. labelSource: 1 aria-label, 2 title, 3 labelledby, 4 text. These are categories, not stored labels.
- tag: 0 other, 1 button, 2 a, 3 div, 4 span, 5 svg. role: 0 other/none, 1 button, 2 link. action/component: attribute-presence flags only.
- actionDepth: 0 no recognized action/button/link ancestor, 1 self, 2 parent, through 6. relation: 0 shared unique-video owner with selected video, 1 nearest owner belongs to another video, 2 shared multi-video ancestor, 3 portal/unproven. These structural categories do not prove semantic button ownership.
- ownerLevel: first selected-video ancestor containing candidate (1..12), 13 not proven. via: 1 local, 2 hit testing, 3 both. members: distinct label-bearing elements merged into same candidate.
- oldSelector / oldLabel / oldBounds / portalBounds: prior selector/exact-label/geometric checks, not the entire transaction or a success verdict.

Apply once to fresh fe8a474b25414b38819b7cf927720899c8c89705. Version 2.18.18 / 2180018; package/signing and accepted UI/media/home/CTA/audio unchanged. Old helper files/fixtures retained; production button remains diagnostic-only.

154 local tests; CI requires exactly 27 Android 13 cases. New native case covers actual V2 asset, long-prefix local discovery, action/bounds categories, native filtering and oversized candidate rejection. Actual Facebook candidate topology must still come from the owner's pasted V2 report.

Local: FACEBOOST_SOURCE=SOURCE JSDOM_PATH=/absolute/node_modules/jsdom node --test integrations/faceboost-2.18.18/*.test.cjs
Compose reference: https://developer.android.com/develop/ui/compose/documentation?hl=ar
