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
