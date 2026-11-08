# Verified 2.18.29 local-image implementation

Commit:f67f2589c393c5c0cbe92f0dbf4855959d19e71e.
CI:https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42518531713
build/chromium-fixtures/candidate all SUCCESS. 237 local tests PASS; exact43 Android13 cases PASS.

- APK:https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42518531713/artifacts/13633220544
  FPRO-2.18.29-media-candidate.apk, generated SHA256SUMS and TAP.
- Native evidence:https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42518531713/artifacts/13632961104
- Exact source/build inputs:https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42518531713/artifacts/13632766958
  Full archive FPRO-2.18.29-source.tar.gz.

Metadata and CI results verified through GitHub API. No independent local APK extraction/signature inspection claimed; artifact ZIP hashes are not APK hashes.

## Evidence

Owner28 screenshot: supported JPEG, Facebook page, target invalid, reason3. This identifies the failed URL gate, but does not distinguish data vs blob.29 supports both safely and records only a fixed scheme category if rejected. No claim the owner's exact scheme has been proven.

New Android tests create a real JPEG data URL, validate and save it through the production saver to MediaStore and compare saved bytes; create an actual Blob URL in a real Facebook-origin WebView, transfer it through the origin-restricted acknowledged bridge, save the PNG and compare saved bytes; reject foreign/cross-origin blobs, foreign pages, video/HTML and mismatched bytes/MIME. Existing40 tests, including system HTTPS-style download request/storage, hold restoration, clipboard/Seal, concealment and UI, remain gated.

Four new JS cases verify exact blob URL, bounded ordered chunks, byte integrity/acknowledgement, size/MIME rejection and stopping on native rejection. Tests are controlled, not owner-account Save-button proof. Limits:8MB compressed payload,50million decoded dimensions,15sec blob session, exact supported MIME and origin. Unsupported/revoked blobs or other URL forms fail safely; older unsupported WebMessageListener has no insecure JS-interface fallback. On Android10+ local results publish into Pictures/FPRO only after writing; older Android uses app-specific Pictures.

Six generated paths differ from28 (version, native tests, new JS asset, media-surface version comment, image routing/diagnostic and new saver). Twenty-one critical paths remain byte-identical: accepted held playback, video download/Seal, clipboard, Share concealment, settings and developer contact. Owner-device success remains pending.
