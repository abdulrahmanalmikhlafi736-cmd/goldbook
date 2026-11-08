# FPRO 🔥 2.18.16 — post-link-only video handoff

## Owner evidence and scope

The owner confirms 2.18.15 did not solve the issue: it copied a signed scontent/fbcdn .mp4 playback URL instead of the post link. A .mp4 URL alone does not prove segmentation (progressive files can be complete), but it is not the requested post permalink. The signed owner URL is not reproduced here.

The owner proposed Useful Scripts. Re-read its [MIT-licensed pinned implementation](https://github.com/Useful-Scripts-Extension/useful-script/blob/d7395352e30d01744c657b5684d4dec212959834/scripts/fb_downloadWatchingVideo.js) through GitHub API. It reads `video.parentElement[reactKey].children.props.videoFBID`, then selects first-playing/visible videos and uses a separate token-assisted downloader. We use only player identity, with the exact element captured by our download button, not a global playing-video guess or its downloader/token routines.

Important: that identity method was ALREADY present in 2.18.15. The React resolver is byte-identical in this revision. Do not present this as discovering a different extractor that is proven to solve the owner's layout. The confirmed bug addressed here is the permissive fallback after identity lookup fails. The reason videoFBID cannot be obtained in the owner's mobile layout remains unknown.

## Applied correction

- New `player-post-download.js` is the production video-button route: resolve owned player's explicit videoFBID, validate the resulting Facebook permalink, send `copy=1&media=&link=...` to native.
- No fallback to currentSrc, data-store.src, signed CDN files, DASH fragments, efg/xpv_asset_id, initial page route or first-playing video.
- A fresh official Share/Copy operation bound to that same video remains the only fallback. If unsupported, no URL is sent; the inherited failure message can still appear.
- Native video receiver requires publicVideoLink even when copy=1 is absent. `publicFirstSource` ignores its historical media argument. Arbitrary HTTPS media is rejected independently of JavaScript.
- Separate story-image action is explicitly marked `kind=image` and retains original direct-image transfer. It is not a video fallback.
- Obsolete current-video-source.js is no longer injected or sampled at attach time. Its file and controlled legacy fixtures remain for regression history, not an active fallback.
- No new polling, idle observer, network interception, token access, chooser, internal downloader or unrelated root-app change.

## Build and evidence

- App commit `f8ace5827216ef78ba7cdb370ac659a6063b574f`.
- Original source `fe8a474b25414b38819b7cf927720899c8c89705`.
- Version 2.18.16 / 2180016; package com.almekhlafi and signing unchanged.
- [All three workflow jobs passed](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42456171788).
- [APK candidate archive](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42456171788/artifacts/13608371132), containing FPRO-2.18.16-media-candidate.apk, SHA256SUMS.txt and TAP. Archive size 3,068,371 bytes is not APK size.
- [Exact project/build inputs](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42456171788/artifacts/13608031876): clean full project inside FPRO-2.18.16-source.tar.gz; outer artifact also includes build APKs/inputs.
- [Android instrumentation evidence](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42456171788/artifacts/13607488411).
- 132 local passes, zero failures/skips: fresh application against pinned source. Nine added tests cover post-only routing, CDN/missing/stale/masquerading values, second-player identity and production/native wiring.
- 25 Android 13 passes (exact OK (25 tests) gate). Added actual-WebView router/native-selector case verifies no CDN export without metadata, the selected player's Useful Scripts-shaped ID when present, empty media argument and native CDN rejection. Existing clipboard/intent assertion now requires CDN rejection; no test skipped.
- Eight changed source paths versus 2.18.15, including two fixture files. Eleven critical files remain byte-identical, including React resolver, WebView, bridge, home/settings and gestures. Media controller body is identical except version comment. See source comparison JSON.

Artifact metadata/archive digests and job IDs are recorded in FACEBOOST-MEDIA-21816-EVIDENCE.json. APK bytes were not independently downloaded here because the sandbox excludes Azure artifact redirect hosts; archive digest is not APK checksum. SHA256SUMS.txt is included in the artifact.

**Acceptance limit:** this corrects the wrong-output path. It does not establish live videoFBID extraction in the owner's account, successful downloading by installed Seal, all-layout compatibility or zero lag. Do not equate fixtures with a Facebook account test. No PR merge.

Compose reference: https://developer.android.com/develop/ui/compose/documentation?hl=ar
