# 2.18.27 evidence boundaries

No new external code. Inspection of pinned reel_gestures.js shows early returns/new touches drop st without clearing its timer or restoring playbackRate; document-only release can miss swallowed events. Single-owner restoration and native terminal-input fallback address those concrete paths while preserving the starting speed and short-tap state.

Pinned MaterialbookWV has no DownloadListener, so actual image-download callbacks have no application handler. Owner screenshot shows the photo-viewer Save row, but does not expose DOM, URL, response headers or prove a download callback fires. This implementation handles real typed-image callbacks only, with no text/coordinate-based Save interception and no global-image selection. Owner acceptance is still required.

Android DownloadManager, not a new video downloader, stores supported images. A loopback fixture tests real file completion/bytes separately from production URL-validation tests. Debug-only cleartext allowance is restricted to127.0.0.1; release is unchanged. No account cookies or tokens are exported/logged by diagnostics; download cookies are scoped by CookieManager to the validated request URL.
