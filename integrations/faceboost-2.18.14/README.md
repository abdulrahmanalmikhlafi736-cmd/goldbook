# FPRO 🔥 2.18.14 — researched, current-player source extraction

Apply once to fresh `faceboost-review` pin `fe8a474b25414b38819b7cf927720899c8c89705`. Package/signing/themes/media geometry/home and Like behavior remain inherited.

Read `RESEARCH.md` for immutable reviewed Frost, yt-dlp, Seal and SlimSocial sources, exact reused ideas, license attribution and limits. This is not another expansion of Share button text guesses.

New `current-video-source.js` runs only on attachment and an owned download request. It handles Frost inlinevideo data-store.src, scoped data-video-url, typed Video numeric identity, videoDeliveryLegacyFields and yt-dlp-style browser_native / playable fields. It rejects arbitrary owner IDs, first global feed records, conflicting identities/sources, stale metadata on player reuse, detached players and mismatched currentSrc/src. Source initialization is distinguished from later recycling. Traversal, JSON bytes and depth are bounded; no network/React inspection, idle observer or timer.

One download click prefers a current scoped permalink; otherwise it copies a verified current HTTPS media URL and sends the same selected value to the existing native Seal quick handoff. Direct CDN links may expire and are not a guarantee of permanent public post URLs. The official Share/Copy attempt remains a fallback only when source extraction cannot prove a URL. It can still fail on unsupported layouts; never claim that repository reputation or fixture success proves owner-account behavior.

Local gate: `FACEBOOST_SOURCE=SOURCE JSDOM_PATH=/absolute/node_modules/jsdom node --test integrations/faceboost-2.18.14/*.test.cjs`. CI requires 22 Android 13 cases, including the new production asset's Frost-source and typed-ID/stale-metadata cases. These are controlled fixtures, not a logged-in Facebook or installed Seal UI test.

Compose reference: https://developer.android.com/develop/ui/compose/documentation?hl=ar
