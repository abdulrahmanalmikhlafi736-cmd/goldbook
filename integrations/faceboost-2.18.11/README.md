# FPRO 🔥 2.18.11 — current permalink, clipboard, Seal quick handoff

Overlay for a **fresh** `faceboost-review` source at `fe8a474b25414b38819b7cf927720899c8c89705`. Run `python integrations/faceboost-2.18.11/apply.py SOURCE` once. Package/signing/icon remain unchanged; version 2180011.

## Scoped change since 2.18.10

- New bundled `public-video-link.js`: synchronous current-element resolver, up to ten bounded ancestors, article/feed/multiple-player boundaries; reads explicit video IDs, bounded documented-shaped data attributes and scoped anchors. No private React state, requests, polling, observers or simulated site-share clicks.
- Prefer the current clip's public **permalink** (not a promise its privacy is public). Supports numeric video/Reel IDs, watch/video links, post/permalink links, share and fb.watch links; strips tracking fields when canonicalizing.
- Source changes invalidate remembered identities/links. Multiple conflicting IDs/links fail closed. The browser address alone is **not** evidence: Facebook may keep the first Reel's address after swiping, even when it creates a new player. Never fall back to the legacy first-anchor picker.
- One owned video-download click emits one `fpro://download` navigation with `copy=1`. Native validation selects permalink before direct HTTPS media fallback, copies that exact selected URL, then uses the existing package-targeted Seal QuickDownloadActivity handoff. No Android chooser/internal downloader.
- If no permalink can be proven, the existing current media resolver remains an HTTPS fallback; an old `currentSrc` disagreeing with a new `src` is rejected. In that fallback, the clipboard contains a media URL, **not a permanent post URL**.
- Legacy image/story handoffs without the flag retain their original direct-first policy and do not acquire clipboard side effects. Clipboard failure cannot prevent an otherwise valid handoff.
- Preserves 2.18.10 home toggle/branding, 2.18.7 Like repair, upper fullscreen gesture, seek design and geometry, theme settings and other inherited features.

## Verification

Local gate: `FACEBOOST_SOURCE=SOURCE JSDOM_PATH=/absolute/node_modules/jsdom node --test integrations/faceboost-2.18.11/*.test.cjs`.

CI builds release/debug/test APKs and requires **14 Android 13 instrumentation tests** before exposing the candidate. Added native cases exercise the actual bundled resolver across recycled identities and the production clipboard/share-intent helpers in a foreground activity. They do **not** claim a real Seal installation, visible Seal menu, logged-in Facebook DOM or owner-account acceptance.

`dom-results.tap` records the local run only. Native results must come from the workflow, never from the copied previous version's evidence. No claims that all videos can be downloaded: Facebook visibility and Seal authentication/support still apply. If neither current permalink nor HTTPS source is proven, download remains blocked rather than silently exporting the first clip.

Compose reference retained: https://developer.android.com/develop/ui/compose/documentation?hl=ar
