# FPRO 🔥 2.18.16 — player post link ONLY, no CDN fallback

Owner reports 2.18.15 still fails and exports scontent/fbcdn .mp4 URLs. The bug is the permissive fallback: after React identity lookup fails, the old current-video-source reader exports currentSrc, then native publicFirstSource accepts arbitrary HTTPS media. An .mp4 URL is not necessarily a segment, but it is not the requested Facebook post link.

The pinned Useful Scripts `video.parentElement[reactKey].children.props.videoFBID` method is already covered by our scoped React resolver; do not claim a new browser extension or an unverified mobile-account fix. Use the precise video captured by our button, not the upstream first-playing/viewport scan. Existing React/source-recycle/ambiguity protections remain unchanged.

New `player-post-download.js` is the only button route: explicit current-player videoFBID -> validated Facebook permalink -> empty media field -> native copy + configured Seal activity. A fresh official Share/Copy action for that same video is the only fallback. If identity cannot be obtained, do not export currentSrc, signed CDN files, DASH segments, xpv_asset_id, initial route or another playing video.

Native ExternalDownloader now requires a validated Facebook post/video link for ALL download routes, including requests without copy=1. Native publicFirstSource ignores its historical media argument. Obsolete current-video-source.js is not injected or sampled on attachment; its file and legacy fixtures remain for regression history only. Missing identity may still cause the existing Share-not-found message; preventing the wrong CDN URL is NOT proof that the owner's mobile layout now exposes videoFBID.

Apply once to fresh upstream fe8a474b25414b38819b7cf927720899c8c89705. Package/signing unchanged; version 2.18.16 / 2180016. Preserve media controller body/geometry (version comment only), Like/fullscreen, home guard, themes, audio and CTA behavior.

Local: FACEBOOST_SOURCE=SOURCE JSDOM_PATH=/absolute/node_modules/jsdom node --test integrations/faceboost-2.18.16/*.test.cjs

132 controlled local tests; CI requires exactly 25 Android 13 instrumentation tests. No logged-in account/Seal UI success claim. No new polling, account-token access, network hook, internal downloader or generic chooser.

Research excerpts and MIT attribution: RESEARCH.md and react-video-permalink.js.
Compose reference: https://developer.android.com/develop/ui/compose/documentation?hl=ar
