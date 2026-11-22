# FPRO 🔥 2.18.12 — official Share / Copy link transaction

## Owner evidence and scope

2.18.11 did **not** fix the owner's current Reel case. The owner then supplied screenshots of both official share-sheet layouts, each with Arabic Copy link, and the manually copied URL `https://www.facebook.com/share/v/1HeYq17541/`. This confirms the official UI offers a source, not that the previous DOM extractor found it or that a particular automatic selector works on the account.

This update attempts official Share → official Copy link → existing native clipboard + Seal QuickDownloadActivity. It does not merely add another permalink regex, read clipboard history or hardcode the supplied URL in production.

## Delivered build

- Tested app commit: `b86a548619629a466c501c3019ac518f10fcc399`.
- Original source pin: `fe8a474b25414b38819b7cf927720899c8c89705`.
- Version `2.18.12` / `2180012`; inherited package `com.almekhlafi`, signing, icon and branding preserved.
- [Successful build / Android / candidate workflow](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42443745776).
- [APK candidate ZIP](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42443745776/artifacts/13602579794), containing `FPRO-2.18.12-media-candidate.apk`, hashes and local TAP evidence. ZIP size 3,060,912 bytes is **not** the APK size.
- [Exact source / build inputs](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42443745776/artifacts/13603001527).
- [Android instrumentation evidence](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42443745776/artifacts/13602619403).

## Implementation and safety

The owned video button starts one transaction bound to its video element, media fingerprint, explicit identity and page URL. A local article/control match is preferred. A portal control requires a dedicated video route, one visible player and geometry inside that player; arbitrary first-feed controls and icon indices are not used.

The transaction clicks an unambiguous official Share control and then a newly visible official Copy link control, using Arabic/English labels or the upstream copy glyph. It never consumes a preexisting potentially unrelated sheet. The existing upstream clipboard hooks notify the transaction of the fresh copied value. Ordinary copies are unchanged, and notification exceptions are isolated from normal clipboard behavior. Native Web Share is intercepted only if available and an explicit transaction is pending.

The selected permalink is validated/canonicalized and sent through the existing `fpro://download` route, which copies the same selected value and explicitly targets Seal's quick activity. Generic Share via behavior remains available for the user's ordinary manual action; it is not the owned download-button route.

The new observer, frame, timeout and interaction listeners exist only during a user-initiated attempt and are removed at completion/cancellation. The attempt is capped at eight seconds / 80 scans. Source/identity/page changes, detach, backgrounding, browsing gestures and choosing another share action cancel pending delivery. No recurring idle polling, touch simulation, page refresh or private React/network scraping was added.

If the official control cannot be identified, a currently verified permalink/HTTPS source can remain a fallback. Otherwise the app explains the manual official-share step during a short waiting window. Unsupported layouts are **not guaranteed one-tap**. If a website ignores a programmatic click or uses an unsupported copy mechanism, this can still fail safely rather than exporting the first Reel's address.

## Verification and preservation

- **84 local tests passed** against the patched pinned source.
- **17 Android 13 instrumentation tests passed**. The three added cases execute the production official-flow asset and real upstream copy-hook segment in WebView: current official-copy URL exactly once; delayed old copy rejected after source reuse; preexisting sheet not consumed.
- These use **controlled DOM Share/Copy handlers**, not logged-in Facebook handlers. Clipboard/intent helpers are separately tested in the retained foreground Compose test. No actual installed Seal UI or owner-account automation acceptance is claimed.
- Source comparison with 2.18.11: **8 changed paths**, 207 inherited files unchanged. Media controller body is identical apart from its version comment. Eight critical files, including WebView/settings/home guard, current permalink resolver and Like/gesture implementation, have identical SHA-256 hashes.
- Preserve the accepted progress/ball geometry, upper fullscreen behavior, Like repair, optional home guard, settings, themes and application identity. No unrelated root project changes or PR merge.

There is no universal downloadability, privacy-bypass, zero-lag or all-account success guarantee. The next acceptance step is the owner's real-account one-tap test on consecutive Reel/feed videos.

Compose reference retained: https://developer.android.com/develop/ui/compose/documentation?hl=ar
