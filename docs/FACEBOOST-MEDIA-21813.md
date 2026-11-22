# FPRO 🔥 2.18.13 — automatic official-copy path, without guessed fallback

## Owner feedback

The owner supplied official Reel/feed share sheets and a real copied URL, then reported that 2.18.12 still displayed the manual-share instruction rather than automating the operation. That build is not owner-accepted. This revision does not claim the screenshots establish a particular DOM selector failure.

## Delivered build

- Tested app commit: `40067d27674580bea2db691b33a9efd2b9870607`.
- Original source: `fe8a474b25414b38819b7cf927720899c8c89705`.
- Version `2.18.13` / `2180013`; inherited `com.almekhlafi` identity, signing, icon and branding preserved.
- [Successful workflow](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42446563402): all three jobs succeeded.
- [APK candidate ZIP](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42446563402/artifacts/13603524832), containing `FPRO-2.18.13-media-candidate.apk`, hashes and local TAP. ZIP size 3,061,877 bytes is not the APK size.
- [Exact source / build inputs](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42446563402/artifacts/13604190837).
- [Android evidence](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42446563402/artifacts/13604211042).

## What changed

1. The owned video download button requires the official Share / Copy transaction. Removed the manual waiting mode and its direct-media/permalink fallback. Ordinary legacy story/image routes retain their inherited behavior.
2. Opening a modal may mark the background video aria-hidden. That no longer invalidates its own pending copy; detach, media/identity/page changes, actual app backgrounding and fresh user interaction still cancel.
3. Current visible controls are selected before the bounded 600-candidate cap. Hidden/offscreen controls retained by a long feed can no longer consume the budget and exclude the newly opened Copy sheet.
4. Recognize aria-labelledby accessible names and additional explicit Arabic Share labels. Keep article/control and dedicated-viewer portal safety checks; no positional first-arrow guessing.
5. Capture the origin-checked main-frame native `copyText` message channel in addition to inherited web clipboard hooks. No system clipboard observer, clipboard-history read or polling loop.
6. Temporarily mask the newly opened sheet's opacity while clicking its official Copy control, restoring its exact style on all exits. Do not remove site DOM, unlock body scrolling or synthesize Back. Entirely invisible transitions are not guaranteed.
7. Preserve the exact validated official Copy payload for native copy and Seal quick handoff. Failure messages distinguish an unrecognized Share control from a missing Copy result instead of instructing the user to finish manually.

The transaction is still bounded to eight seconds / 80 scans and runs only on demand. It can fail safely if Facebook's controls cannot be identified or its handler rejects programmatic activation; the app must not silently export a different clip.

## Verification and limits

- **88 local tests passed** against the patched pinned source, including background-modal state, accessible names, style restoration, exact URL payload and hidden long-feed controls, plus retained safety/media/gesture/settings cases.
- **20 Android 13 instrumentation tests passed**. New native cases execute production code for the modal-hidden background, real origin-checked WebMessage copy bridge and hidden long-feed controls. Retained tests cover clipboard/share-intent helpers and prior media/home/branding behavior.
- These use controlled Share/Copy handlers, not logged-in Facebook handlers. The gate does not exercise an installed Seal UI. Owner-account one-tap success remains unconfirmed and must not be inferred from fixture passes.
- Fresh-source comparison against 2.18.12 changes only **7 paths**. The media controller body is unchanged apart from the version comment; eight critical settings/WebView/home/Like/permalink files have identical SHA-256 hashes. See source-comparison JSON.
- No universal downloadability, privacy bypass, zero-lag or all-layout guarantee; a permalink does not change post visibility. No unrelated root application changes or PR merge.

Compose reference: https://developer.android.com/develop/ui/compose/documentation?hl=ar
