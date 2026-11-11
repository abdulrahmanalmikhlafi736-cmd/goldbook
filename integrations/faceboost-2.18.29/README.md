# FPRO 2.18.29 — actual local image download payloads

Owner28 diagnostic: reason3, image/jpeg, Facebook page, invalid target under HTTPS-only validation. This proves target URL validation is the failing gate, NOT MIME. The28 diagnostic did not record scheme; do not claim the screenshot proves blob vs data.29 safely supports both local forms and adds a fixed scheme category to remaining failures.

## Local images only

ImageDownloads first offers the exact download callback URL to LocalImageSaver. Requires an HTTPS Facebook page and a supported declared image MIME. Data URLs must have an exact matching image/base64 prefix. Blob URLs must encode that exact Facebook origin (no cross-subdomain, null or foreign blob). No DOM/image guessing, HTTP fetching or network interception.

Data bytes decode on one shared IO worker. For blobs, origin-restricted WebMessageListener is installed before navigation, and an on-demand script fetches only that blob URL.8MB cap,32KB sequential chunks with acknowledgements, main-frame/source-origin/current-page/unguessable-session/sequence checks and15sec timeout. Unsupported WebViews fail safely rather than exposing an unverified JavaScriptInterface.

All local bytes must pass native image decoder bounds/MIME checks (positive dimensions, <=50million pixels, exact declared format) before storage. Android10+ uses pending MediaStore Images entry in Pictures/FPRO, published only after complete write; failure deletes the pending entry. Older Android uses app-specific Pictures and media scan without broad storage permission. Success feedback happens only after write/publish, not enqueue. No video payloads, arbitrary file paths, SVG/HTML or clipboard access.

Existing typed HTTPS image DownloadManager path remains. All accepted video/Seal, hold-release, progress/ball, Share concealment, developer contact and identity/signing configuration remain unchanged.

Version2.18.29/code2180029/com.almekhlafi; original signing. Apply once to fresh fe8a474b25414b38819b7cf927720899c8c89705.

237 local tests PASS (233 retained +4 chunk/ack/type/size tests). Native exact43-case gate retains40 and adds real data-JPEG save/byte roundtrip, actual WebView blob-PNG transfer/save/byte roundtrip, foreign-origin/video/HTML/format-spoof negatives. All three jobs of run42518531713 passed, including exact43 Android13 cases atf67f2589c393c5c0cbe92f0dbf4855959d19e71e. Owner exact scheme and account success remain pending; tests do not prove owner DOM.

Compose reference: https://developer.android.com/develop/ui/compose/documentation?hl=ar
