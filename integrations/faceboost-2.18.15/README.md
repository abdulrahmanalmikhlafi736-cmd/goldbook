# FPRO 🔥 2.18.15 — extract the passed player's Facebook identity

This is an implementation of active-player link discovery, not another known-URL downloader. See the new section of RESEARCH.md for immutable MIT source references (Bluemaster, Useful Scripts, Bengal DM), attribution and excluded behaviors.

Apply once to fresh `faceboost-review` pin `fe8a474b25414b38819b7cf927720899c8c89705`. New `react-video-permalink.js` reads explicit videoFBID from the current video's owning React props / bounded fiber chain and constructs a Facebook watch permalink. The existing download button's closure supplies that exact video: do not choose document.querySelector('video') or the first playing video.

Use bounded children/props paths and named metadata fields only. Stop at shared/feed roots, reject conflicting IDs and alternate trees, reject unsafe numeric IDs and stale metadata during source changes. No account-token read, network/GraphQL call, fetch/XHR patch, whole-feed scrape, private-props dump, new idle observer/timer or generic Android chooser.

Prefer this permalink, then retain 2.18.14's scoped data/media extraction and official Share/Copy fallback. Existing native copy and Seal quick handoff, media controller body, seek geometry, Like/upper fullscreen, home option, themes and identity are preserved.

Local gate: `FACEBOOST_SOURCE=SOURCE JSDOM_PATH=/absolute/node_modules/jsdom node --test integrations/faceboost-2.18.15/*.test.cjs`. CI requires 24 Android 13 instrumentation cases. Fixtures are controlled React-shaped objects and are NOT a logged-in Facebook account test or actual installed Seal UI test. Unofficial React properties may not exist on a particular mobile layout; no universal one-tap or zero-lag promise.

Compose reference: https://developer.android.com/develop/ui/compose/documentation?hl=ar
