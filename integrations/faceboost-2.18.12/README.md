# FPRO 🔥 2.18.12 — official Share → Copy link → Seal

Apply once to **fresh** `faceboost-review` source pinned at `fe8a474b25414b38819b7cf927720899c8c89705` using `python integrations/faceboost-2.18.12/apply.py SOURCE`. Version 2180012; inherited package/signing unchanged.

## Change since 2.18.11

The owner confirmed two official share-sheet layouts, both offering Arabic Copy link, and supplied `https://www.facebook.com/share/v/1HeYq17541/`. Merely recognizing this URL format was insufficient: the failed previous extractor did not invoke the official sharing flow.

`official-download.js` now attempts an explicit, current-video-bound transaction from the owned download button:

1. Find an unambiguous visible official Share control in the video's article/local single-visible-player scope. A dedicated Reel route also permits one geometrically matching labeled portal control. Never choose the first share control in the feed or an unlabeled icon by index.
2. Click it, wait for a new visible official Copy link action and click it once. Support Arabic/English labels and the existing upstream copy glyph. Never consume a preexisting share sheet or the injected Share via row.
3. The existing always-loaded upstream clipboard hooks notify this transaction of the fresh text emitted by Copy link (writeText, execCommand and DataTransfer). No clipboard history reads/listener or saved link cache. Native Web Share is handled if actually available; ordinary calls remain ordinary.
4. Validate/canonicalize that URL and hand it through the existing native copy + package-targeted Seal QuickDownloadActivity path. No generic chooser/internal downloader.

Only one pending transaction. Fingerprint, explicit identity, page URL, visibility and connectedness bind it to the selected player. Source changes, detach, page changes, backgrounding or browsing gestures cancel it. Ambiguous Copy controls abort. The temporary observer, scheduled frame, listeners and eight-second timeout are removed on completion/cancellation. No idle observer, recurring timer or simulated touch/scroll sequence is added. The original upstream Share via implementation remains intact; one notification is added to its existing remember function.

If a share control is not identifiable, use a currently verified permalink/HTTPS source if available. Otherwise provide a brief opportunity to open the current official Share control manually, with an explanatory message; this is explicitly **not guaranteed one-tap behavior on unsupported layouts**. An already-open sheet is not automatically trusted. Native permissions/capture API variations or site rejection of a synthetic click can still prevent automation.

## Verification boundary

Run `FACEBOOST_SOURCE=SOURCE JSDOM_PATH=/absolute/node_modules/jsdom node --test integrations/faceboost-2.18.12/*.test.cjs`.

CI requires release/debug/test builds and **17 Android 13 instrumentation tests** before publishing the candidate. The three new cases execute the production official-flow asset and the actual upstream clipboard-hook segment in WebView, capturing real custom-scheme navigation. Controlled DOM handlers stand in for Facebook's Share/Copy handlers. This is **not logged-in Facebook DOM, a real installed Seal or an owner-account acceptance test**. Existing clipboard/intent, home toggle, branding, Like/gesture/seek tests are retained.

No promise of universal downloadability, privacy bypass, exact real-account behavior or zero lag. Preserve previously accepted layout and settings. Compose reference: https://developer.android.com/develop/ui/compose/documentation?hl=ar
