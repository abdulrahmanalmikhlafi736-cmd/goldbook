# FPRO 🔥 2.18.11 — current video link, copy, Seal quick handoff

## Delivered build

- App commit: `2ff0b33eb5b45e205d7a843a573f4f7e01ea25f3`.
- Original source pin: `fe8a474b25414b38819b7cf927720899c8c89705`.
- Version `2.18.11` / `2180011`, package `com.almekhlafi`; inherited signing/icon preserved.
- [Successful workflow](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42440877915): build, Android fixtures and candidate all succeeded.
- [APK candidate ZIP](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42440877915/artifacts/13602180830): `FPRO-2.18.11-media-candidate.apk`, hashes and local TAP report; ZIP size 3,057,336 bytes, not the APK size.
- [Exact source/build inputs](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42440877915/artifacts/13601299644).
- [Android instrumentation evidence](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42440877915/artifacts/13602130897).

## Behavior

The owned video download button now asks a separate current-element resolver for a Facebook permalink. It uses bounded ancestor scopes, explicit IDs, data-store/data-ft metadata and post/video anchors. It understands Reel/watch/video, post/permalink, group posts, share and fb.watch URL families. This replaces the old first-matching-anchor choice for this button; it does not automate Facebook's Share menu.

The native route prefers that validated permalink to a direct media source, copies the **same selected URL** to Android's clipboard, then uses the existing explicit Seal QuickDownloadActivity handoff. No generic chooser or internal downloader was introduced. Existing configured-package behavior remains intact.

If a permalink is unavailable, an existing HTTPS media source remains a fallback, and that media URL is what gets copied. A divergent old currentSrc is rejected while a new src is pending. If neither source is trusted, the existing protective toast remains: the initial Reel address is never substituted merely because it is in the address bar. Clipboard failure does not block an otherwise valid handoff. Legacy image/story routes without the new flag retain their original direct-first/no-copy behavior.

A public-style permalink is an address, **not a change to post visibility**. Seal support, login and Facebook visibility restrictions still apply.

## Verification and preservation

- **68 local tests passed**, including deep links, metadata IDs, group post links, canonicalization, ambiguous links/IDs, multiple players, comments/hidden scopes, detached/recycled players, repeated attachment, route-only rejection and divergent media sources, plus all inherited local regressions.
- **14 Android 13 instrumentation tests passed**. Added tests execute the actual resolver with recycled clip identities, and verify the production clipboard/share-intent helpers in a foreground Compose activity. The existing settings persistence/branding/media/gesture tests remain in the gate.
- These are controlled fixtures, not logged-in Facebook acceptance. A real installed Seal and its visible download menu were **not** exercised by this gate; the package-targeted intent contract and inherited explicit activity handoff are distinguished from that claim.
- Fresh-source comparison against 2.18.10 finds **8 changed paths**, with 206 inherited files unchanged. The media controller is identical except its version comment. Six critical settings/WebView/home-guard files have identical SHA-256 hashes. See adjacent source-comparison JSON.
- Original themes, branding, home swipe option, Like repair, fullscreen gesture and seek geometry are preserved. No unrelated root-app changes or PR merge.

Compose reference: https://developer.android.com/develop/ui/compose/documentation?hl=ar
