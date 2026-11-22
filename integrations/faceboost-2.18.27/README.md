# FPRO 2.18.27 — release held acceleration and handle real image-download callbacks

Owner confirms26's appearance. Reports occasionally stuck hold acceleration and a no-op Save row in Facebook's photo-viewer overflow menu (owner screenshot). Screenshot identifies the row, not its DOM/URL or emitted MIME.

## Hold repair

Inherited reel code could overwrite an existing held state on a new/multi/UI/upper touch without restoring the former video. It only restored via document touchend/trusted touchcancel or a route/detach interval. Add single-owner cleanup before every new touch and trusted window-capture release, blur/visibility/page navigation cleanup, and a native WebView UP/CANCEL fallback for releases swallowed by page handlers. Restore the previous rate (including1.25), not a global1x. Keep own synthetic long-press cancellation ignored. Native fallback cancels pending boost timeout without destroying short-tap state. Existing bounded-to-hold200ms route/detach interval remains; no new polling.

## Photo Save plumbing

Pinned app has no WebView DownloadListener after removing its earlier download mechanism. Install an image-only listener in the main Facebook WebView. It accepts actual HTTPS Facebook/fbcdn typed JPEG/PNG/WebP/GIF/AVIF download callbacks from a Facebook page, never guesses an image from the DOM or routes videos to an internal downloader. Pass the download URL's own cookie and user-agent to Android DownloadManager. Android10+ destination Pictures/FPRO with completion notification/media scan; older Android uses DownloadManager's managed destination without broad storage permission. No toast claims success merely from enqueue: notification carries the final result. Unsupported/failed starts have explicit feedback.

The exact owner Save callback/MIME is not proven from the screenshot. If Facebook does not emit a supported image-download callback this repair may need additional investigation; do not claim account proof.

## Verification

Version2.18.27/code2180027/com.almekhlafi; original signing. Apply once to fresh fe8a474b25414b38819b7cf927720899c8c89705.

233 local tests PASS (220 retained,13 new held-state cases). Native exact39-case gate adds real WebView MotionEvent cancellation/previous-rate restoration, image request validation negatives and actual system DownloadManager PNG byte roundtrip from an instrumentation-only loopback server to public image storage. All three jobs of run42513098596 passed, including exact39 Android13 cases at6ecce63bae6a8f2ac0a1c0b2a9ff795713c59648. Debug-only network config permits127.0.0.1 HTTP for that fixture; release and production image validation do not permit HTTP.

Preserve circular video/Seal download, clipboard privacy, accepted Share/Copy concealment, progress/ball position/size, developer footer, Like/fullscreen/seek/home gestures, themes and identity. Compose reference: https://developer.android.com/develop/ui/compose/documentation?hl=ar
