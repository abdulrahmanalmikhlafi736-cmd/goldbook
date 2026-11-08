# Upstream research and adaptation

This is source review, not a guarantee that an upstream project handles the owner's live Facebook layout. No repository provided a universal current-player selector or guaranteed secret Share/Copy automation.

## Frost for Facebook — archived, GPL-3.0-or-later

Pinned reviewed master: `0a3339aee3fb058180d9d58e9639ae13973cd96b`.

[media.ts](https://github.com/AllanWang/Frost-for-Facebook/blob/0a3339aee3fb058180d9d58e9639ae13973cd96b/app/src/web/ts/media.ts) locates `data-sigil` containing inlinevideo, moves to its data-store wrapper, parses it, then reads:

```javascript
const url = dataStore.src;
```

Our GPL-3.0-or-later adaptation credits Allan Wang and contributors. It retains the inline-video relationship but binds the extraction to the actual video element, caps work, validates HTTPS, and rejects stale source reuse. It does not copy Frost's internal native player/downloader, global click interceptor or HTTP allowance.

## yt-dlp — Unlicense

Pinned reviewed master: `412e7f0a4b0588fe884a02b344ac66a06538475b`.

[facebook.py](https://github.com/yt-dlp/yt-dlp/blob/412e7f0a4b0588fe884a02b344ac66a06538475b/yt_dlp/extractor/facebook.py) identifies typed Video objects using `videoId`/`id`, handles `videoDeliveryLegacyFields` and playable_url / playable_url_quality_hd / playable_url_dash / browser_native_hd_url / browser_native_sd_url. FacebookReelIE converts a **known** numeric Reel ID to `https://m.facebook.com/watch/?v=ID&_rdr`.

Our JavaScript adaptation uses the field conventions and numeric-ID-to-watch mapping. It reads only bounded public JSON attributes/scripts in the current single-player scope; it does not copy the Python extractor, download all feed data, inspect private React internals, issue GraphQL requests or choose a first global Video object. Generic owner/post IDs are not video identity. Metadata HD is preferred only within the same recognized video record. Unknown or conflicting records fail closed.

Important limitation: yt-dlp normally starts with a known post/video URL; it does **not** itself solve identifying an unlabeled active player in a Facebook WebView. Adding yt-dlp inside this app would duplicate Seal rather than resolve that ambiguity.

## Seal — GPL-3.0

Pinned reviewed main: `7677f61a20fda4210e84215fef9e9b51d25daa47`.

[QuickDownloadActivity.kt](https://github.com/JunkFood02/Seal/blob/7677f61a20fda4210e84215fef9e9b51d25daa47/app/src/main/java/com/junkfood/seal/QuickDownloadActivity.kt) receives ACTION_SEND / EXTRA_TEXT. Existing app handoff already follows this contract and explicitly resolves this exported activity. Retain it, without a generic Android chooser or internal downloader.

## SlimSocial — inspected, not copied

Pinned reviewed master: `69004197775e0397abe3667da9355e98dde8b82d`; GPL-2.0.

The repository's [media plan](https://github.com/rignaneseleo/SlimSocial-for-Facebook/blob/69004197775e0397abe3667da9355e98dde8b82d/docs/superpowers/plans/2026-08-04-media-viewer-and-downloads.md) records a feed-layout observation of `data-video-url` pointing to fbcdn HTTPS, while explicitly saying video downloads were out of scope and Reel coverage was unverified. Treat this as a schema observation, **not tested production download code**. No GPL-2.0 source was copied. Reading a standard-looking attribute on our bounded player scope does not establish all-layout support.

## Behavior of the adaptation

Prefer a scoped numeric ID / validated current permalink; otherwise use the current HTML media source or a uniquely bound Frost/yt-dlp-style HTTPS source. Copy that selected URL and send directly to Seal. A CDN media URL can expire and is not the permanent post URL. Keep the official Share/Copy flow only if no data source is proven, not as the sole dependency. Never substitute the initial Reel address.

Third-party reference excerpts are small and attributed; full upstream license files remain in their linked repositories. The shipped overlay is GPL-3.0-or-later within the existing GPL application.

## 2.18.21: the actual active-player identity problem

The owner clarified that known-link downloaders are not the requested research. The following sources operate on the DOM video/player itself:

- [Bluemaster](https://github.com/thuytx03/bluemaster/blob/833e8b365975774fca4938d09eca6f3f49a557d4/src/modules/auto-run/features/facebook/add-download-video-btn.feature.ts), MIT, Copyright 2026 Trịnh Xuân Thuỷ: getVideoId(videoEl) reads the video's parent's __reactProps property, children.props.videoFBID or coreVideoPlayerMetaData.videoFBID. Its button retains a closure over that exact video, then constructs a Facebook video URL.
- [Useful Scripts](https://github.com/Useful-Scripts-Extension/useful-script/blob/d7395352e30d01744c657b5684d4dec212959834/scripts/fb_downloadWatchingVideo.js), MIT, Copyright 2022 Hoang Tran: reads videoFBID from each player's React props, selects playing/visible videos, then downloads them. **Do not adopt its global first-playing selection, session-token access or download-all behavior.** Our owned button already has the precise video element.
- [Bengal DM](https://github.com/tazihad/bengal-download-manager/blob/ac78e0397f9163c04d78252331019653f035e2d0/extension/src/sites/facebook/main/facebook-page.js), MIT, Copyright 2026 tazihad: inspectVideo(video) reads owning React Fiber memoizedProps, coreVideoPlayerMetaData, videoPlayerConfig and videoData variants to obtain videoFBID. **Do not adopt network interception, large manifest caches, token access, whole-page fallback or duration-based clip inference.**

`react-video-permalink.js` adapts only bounded current-element ID access and preserves full upstream MIT notices. It reads at most five DOM levels / eight owning fiber levels, with finite props/children budgets; it does not walk arbitrary sibling fibers or serialize props. Generic owner IDs are not read. Shared feed/multi-player DOM roots are barriers. Conflicting IDs, disagreeing alternate trees, source transitions and stale recycled-player IDs are rejected. Getter-backed React expando properties are not invoked.

On an owned download click, a single proven videoFBID becomes `https://www.facebook.com/watch/?v=ID`, then uses the existing clipboard + explicit Seal quick route. Previous scoped source extraction and official Share/Copy remain fallbacks, rather than selecting a first page video. No new network hook, account-token read, observer, polling, layout mutation or chooser.

React properties are private implementation details and these sources are browser extensions/userscripts, not proof that the owner's mobile Facebook layout exposes the same properties. Controlled tests verify our adaptation, not logged-in account acceptance. We must distinguish these facts when delivering the APK.

## 2.18.21 owner failure: playback CDN URLs are not post links

Owner confirmed 2.18.15 exports a signed scontent/fbcdn .mp4 URL instead of the current post link. The permissive media-source fallback caused this: the Useful Scripts-style identity read was already present, but its failure fell through to currentSrc/data-store.src and the native selector accepted arbitrary HTTPS.

Re-read Useful Scripts at the same immutable pin via GitHub API. Its exact identity expression is `video.parentElement[key].children.props.videoFBID`. That method is already implemented in the scoped resolver; copying its whole-page first-playing selection, token extraction or actual media downloader would not solve the missing current-player metadata and would risk selecting another video.

2.18.21 retains the MIT-attributed identity extractor, adds a strict post-only routing layer, removes playback-source fallback/injection/sampling, and makes the native receiver reject arbitrary HTTPS media for video requests even without copy=1. Do not derive a Facebook post ID from efg/xpv_asset_id; the asset identifier does not prove current post identity. Do not infer that every .mp4 CDN URL is segmented: progressive files may be complete, but are still not post permalinks.

These changes correct the confirmed wrong-output behavior. They do NOT establish why the owner's mobile page lacks a resolvable videoFBID, nor prove live identity extraction succeeds. Only a fresh official Copy operation can supply a fallback; otherwise no URL is sent. Native fixture verifies the real JavaScript routing asset and native permalink selector reject CDN and preserve the passed player's Useful Scripts-style ID.

Preservation: story-image downloads have their own explicit `kind=image` route and retain the original direct-image transfer. Only that separate image action can use the legacy media selector; all video routes require a post link.

## 2.18.21: diagnose the actual page, not another extractor claim

The owner confirmed 2.18.16 still fails with Share-not-found and explicitly approved a local diagnostic build. This revision does not change the React ID extraction algorithm or claim it works on the owner's layout. It replaces the video download action with an on-demand, bounded structural report. The report deliberately excludes IDs/values/URLs/text/raw attributes/React dumps, and the native receiver reconstructs a numeric allowlist before display or explicit copying. No network, account storage read, automatic upload or automatic clipboard write. See README for code mappings and limits. Actual next extraction work must follow the owner's returned report rather than a new hand-written fixture assumption.

## 2.18.21: real owner evidence changes the investigation

Both returned V1 reports show zero detected React props/fibers and known ID fields in the sampled hosts, mobile mcomponent/action attributes, sourceAgreement=1 and two document video elements. The Reel report has one broad Share-like match; the other has a limit flag. Do not infer a specific Facebook runtime, global absence of metadata, both videos playing, exact control ownership or the specific limit cause from these aggregates.

V2 gathers bounded local-first and viewport-hit-tested structural candidate categories, action ancestry, ownership relationships, old selector/label/bounds results and visibility differences. It does not copy an upstream downloader, invent a permalink, derive a video ID from CDN assets, click a guessed Share control or claim a solved extractor. Schema/privacy constraints are in README. Another controlled fixture is validation of diagnostics, not proof of account success.

## 2.18.21 actual V2 evidence: accessible-name rejection

Both supplied V2 reports identify one candidate whose old selector and geometric checks pass, locally associated with the selected video, while old exact label fails. The broad classification is aria-derived; its actual text was not exported. Therefore this revision does not claim to know the exact suffix or replace the extractor with another repository. It repairs this rejection class within the observed role/action/component/unique-owner footprint and restores official Share/Copy routing. Copy-link support and privacy-preserving attempt telemetry distinguish subsequent action/menu failures from repeating Share-not-found. The unchanged native video receiver still requires a real Facebook post/video link, never CDN playback assets.

## 2.18.21: owner-confirmed routing, remove clipboard side effect

2.18.19 is now owner-confirmed functional. Earlier clipboard handoff descriptions above are historical: 2.18.21 captures fresh official Copy output before any real writer, routes with copy=0, and removes native download clipboard writes. No further extraction-source adaptation was needed. Native pre-write interception, scoped web clipboard hooks and ordinary manual-copy preservation are local changes; see README and tests. No account acceptance for 2.18.21 is claimed.

## 2.18.21: no guessed home Share glyph

The owner supplied 2.18.20 report and screenshots. Icon/count-only Share is visually confirmed, but its DOM glyph/font/resource is not. The pinned original's scripts.js explicitly documents U+F310F as Copy link; it is NOT evidence for a Share glyph. Source/code search produced no verified Share mapping and no code was adapted from those results. This revision adds bounded, numeric public-icon evidence only, with native privacy filtering; it intentionally does not claim to fix home downloads or choose actions by position. Existing extraction and internal no-clipboard handoff are preserved.
