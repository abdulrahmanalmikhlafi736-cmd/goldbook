# Verified 2.18.27 delivery

Commit:6ecce63bae6a8f2ac0a1c0b2a9ff795713c59648.
CI:https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42513098596
build/chromium-fixtures/candidate all SUCCESS. 233 local tests PASS, no failures/skips. Native gate requires exact OK (39 tests) on Android13.

## Deliverables

- APK bundle:https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42513098596/artifacts/13631110138
  FPRO-2.18.27-media-candidate.apk, build-generated SHA256SUMS and TAP.
- Native evidence:https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42513098596/artifacts/13630507411
- Exact source/build inputs:https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42513098596/artifacts/13630292874
  Full project archive FPRO-2.18.27-source.tar.gz.

GitHub metadata/results verified via API. No independent local APK extraction/signature inspection claimed; artifact ZIP hashes are not APK hashes.

## Evidence and boundaries

- Actual BackgroundAudioWebView MotionEvent cancellation restores a held rate2 to its starting1.25, including a detached WebView whose View.post queue does not drain. Native terminal cleanup uses main Looper rather than attachment-dependent View.post.
- Real system DownloadManager writes an instrumented loopback PNG to public image storage on Android13; downloaded bytes are read back and exactly compared, then removed. Production validator separately rejects HTTP/foreign pages/foreign hosts/video/HTML/data URLs. Loopback bypass is constructed only inside instrumentation, with a debug-only127.0.0.1 HTTP network exception; no release exception or JavaScript interface is added.
- This is not an end-to-end logged-in Facebook Save-button test: the owner's exact callback, URL and MIME are unknown. If Save does not emit a supported typed-image download, more investigation is needed. Notification reports final file status, not an unconditional saved toast.
- Existing strict clipboard/Seal, Share concealment, visual progress/ball, settings/developer contact and gesture cases remain gated. Source comparison records nine changed/new paths and18 critical byte-identical paths. media-surface change is its version comment only.

Initial run42512074748 built but failed the new native release case (rate stayed2); all other38 cases, including actual PNG storage, passed. The attachment-dependent native post was replaced with main-Looper dispatch, without weakening the test. Final run passes39. Owner-device acceptance of both issues remains pending.
