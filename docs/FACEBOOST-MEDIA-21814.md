# FPRO 🔥 2.18.14 — researched current-player source extraction

## Request and limits of the evidence

Owner screenshots confirm 2.18.13 fails to identify the official Share control in both Reel and feed layouts. The owner requested repository research, source excerpts and actual application, allowing either official copy automation or extracting the video's real URL. This revision takes the latter route before attempting the existing Share/Copy fallback. It does not infer a hidden DOM selector from the screenshots or claim logged-in acceptance.

## Research actually reviewed

- **Frost for Facebook**, GPL-3.0-or-later, archived: [media.ts at master pin](https://github.com/AllanWang/Frost-for-Facebook/blob/0a3339aee3fb058180d9d58e9639ae13973cd96b/app/src/web/ts/media.ts). Its inline-video handler parses data-store and reads `dataStore.src`. Also checked default dev pin `653f67b5a9de45f965cf4c53aca2fb60f37a3afa`; the media.ts file is byte-identical, SHA-256 `06f78c2d815f056072e00b154b258cd24f5937758fd69a9b93c96809d910e30f`.
- **yt-dlp**, Unlicense: [Facebook extractor pin](https://github.com/yt-dlp/yt-dlp/blob/412e7f0a4b0588fe884a02b344ac66a06538475b/yt_dlp/extractor/facebook.py). Reviewed typed Video IDs, videoDeliveryLegacyFields, playable/browser_native URL fields and FacebookReelIE's known-ID-to-watch mapping. This extractor starts from a known URL; it is not a universal active-WebView-player detector.
- **Seal**, GPL-3.0: [QuickDownloadActivity pin](https://github.com/JunkFood02/Seal/blob/7677f61a20fda4210e84215fef9e9b51d25daa47/app/src/main/java/com/junkfood/seal/QuickDownloadActivity.kt). Confirmed ACTION_SEND / EXTRA_TEXT receiving contract; retained the existing explicit quick-activity handoff unchanged.
- **SlimSocial**, GPL-2.0: reviewed pin `69004197775e0397abe3667da9355e98dde8b82d`. Its media planning document records a data-video-url feed observation, explicitly not production video-download/Reel support. No GPL-2.0 code was copied and the observation is not described as a proven downloader.

Detailed excerpts, links, license attribution and adaptation boundaries are in `integrations/faceboost-2.18.14/RESEARCH.md`.

## Implemented adaptation

New `current-video-source.js` credits Frost and yt-dlp. It reads only the selected video's bounded single-player ancestors and local public JSON, supporting inlinevideo data-store.src, data-video-url, typed Video numeric identity and playable/browser_native fields. Prefer a known current permalink; otherwise use the actual current HTTPS media source or one uniquely bound metadata source. Copy the same selected value through the existing native route and hand it to Seal.

No whole-feed first-Video search, private React access, network/GraphQL requests, clipboard-history read, idle timer or observer. Empty/relative metadata cannot resolve to the first Reel address. Owner IDs are not Video IDs; ambiguity, detach, divergent currentSrc/src and stale source-reuse metadata are rejected. Initial source setup is distinguished from later recycling.

A CDN media URL can expire and is not the permanent post URL. Visibility, login, extraction support and content restrictions still apply. If no source is proven, the inherited official Share/Copy path remains a fallback and can still fail for unsupported layouts.

## Delivered build and verification

- App commit `2f9d6ce917c6400105b76e73fb5c18f0da3692cc`.
- Fresh original source `fe8a474b25414b38819b7cf927720899c8c89705`.
- Version `2.18.14` / `2180014`, package `com.almekhlafi`; inherited signing, icon and app identity preserved.
- [All jobs successful](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42448476675).
- [APK candidate ZIP](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42448476675/artifacts/13604019433), containing `FPRO-2.18.14-media-candidate.apk`, hashes and TAP. ZIP size 3,064,757 bytes is not the APK size.
- [Exact source/build inputs](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42448476675/artifacts/13604738030).
- [Native instrumentation evidence](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42448476675/artifacts/13604504108).
- **105 local tests passed**, including 17 new extraction cases and retained regressions. Fresh overlay was reapplied and the local gate rerun against that source.
- **22 Android 13 cases passed**, including the actual new asset reading a Frost-style source without a Share button and rejecting typed-video stale metadata after player reuse. Retained cases cover clipboard/intent, previous official-copy flow and media/home/branding behavior.
- Fixtures contain controlled schema data and are not logged-in Facebook acceptance or an installed Seal UI test. Repository reputation is not proof that a particular live layout exposes the fields. No all-account, guaranteed-one-tap or zero-lag claim.
- Comparison against 2.18.13: **6 changed paths**, media controller body unchanged except version comment; ten critical files including native handoff/bridge, settings/WebView/home, current permalink resolver, official flow and Like gestures are byte-identical. No unrelated root-app edits or PR merge.

Compose reference: https://developer.android.com/develop/ui/compose/documentation?hl=ar
