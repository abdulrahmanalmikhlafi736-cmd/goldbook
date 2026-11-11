# FPRO 🔥 2.18.17 — local structural player diagnostics

## Explicit approval and purpose

Owner screenshot confirms 2.18.16 still ends at Share-not-found. The owner approved an on-device diagnostic report on the real selected clip rather than another claimed extractor fix. This build intentionally replaces the video download button action with a diagnostic report dialog. It does not invoke Seal or official Share/Copy for that press. No live report has been received yet and no extraction/download success is claimed.

## What to do on the phone

1. Install the APK over the current version (same package/signature; newer version code).
2. Open a video/Reel with the existing download button.
3. Press that button: a native dialog titled `تقرير المقطع — تشخيص فقط` opens.
4. Press `نسخ التقرير` and paste the resulting text into this conversation, not a screenshot.

Copying is explicit; closing does not write the clipboard. The report remains local unless the owner chooses to send it. No account credentials, developer-mode setup or ADB are required.

## Data minimization and limits

New player-diagnostic.js captures only the passed video and up to eight single-video owning hosts. It counts React props/fibers, known mobile attributes, known ID-field/type/path shapes, source category/agreement and visible nearby control/permalink categories. Bounds: 200 metadata objects, depth seven, first eight array members, 32 field hits, small JSON attribute byte budgets and first 500 nearby candidates. Shared feed/main/multi-video ancestors stop metadata traversal. No getter-backed React fields are invoked.

No actual IDs/values, destinations, signed CDN URLs, text, arbitrary labels/action IDs/object keys, raw HTML/attributes, raw React objects, cookies, account storage or token values are exported. Known field/path/type codes are numeric; schema decoding is documented in the integration README. Counts cannot identify the exact control by themselves; the returned structural evidence determines the next narrow investigation, not a promise of a solved extractor.

Native PlayerDiagnostic independently rebuilds a numeric allowlist, bounds all numbers/rows/paths/payload length, and discards unknown page fields/strings before showing or copying. The diagnostic route checks the live Facebook context. Explicit Copy uses the foreground native clipboard and Android 13 sensitive flag. Invalid payloads are not copied. Repeated report dialogs replace the previous dialog through a weak reference.

No automatic upload/network request, report-file storage, timer or observer. Existing story-image download remains separate. Browsing/seek/Like/fullscreen/home/CTA/themes/audio behavior and native post-only video validation are not rewritten.

## Verified build

- App commit `db2a6ceb3503b00706ad1feb9b021a7ac57c2dd5`.
- Pinned original `fe8a474b25414b38819b7cf927720899c8c89705`.
- Version 2.18.17 / 2180017; original com.almekhlafi package/signing.
- [All three jobs successful](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42457793349).
- [Diagnostic APK archive](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42457793349/artifacts/13609280239): FPRO-2.18.17-media-candidate.apk, SHA256SUMS.txt and TAP. Archive size 3,072,723 bytes is not APK size.
- [Exact source/build inputs](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42457793349/artifacts/13607953562): full clean source inside FPRO-2.18.17-source.tar.gz; outer archive also contains fixture/build APKs.
- [Native test evidence](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42457793349/artifacts/13609075871).
- **143 local tests pass, zero failures/skips**, with 11 new diagnostic cases: privacy, known metadata shapes, getters, forbidden account/network access, wrong-player boundary, work limits, source classifications/transitions, nearby controls, invalid contexts and production wiring.
- **26 Android 13 cases pass**, exact OK (26 tests) gate with failure/crash rejection. Added real WebView diagnostic payload and native formatter test; rejects unknown strings/oversized/schema-invalid data; rejects a foreign context; exercises the allowed-context native dialog and actual Copy button/clipboard after draining the dialog Handler.
- Eight changed source paths versus 2.18.16. Eleven critical runtime files are byte-identical. Media controller body differs only in version comment. See source-comparison JSON.

GitHub API artifact metadata/archive digests and job IDs are stored in FACEBOOST-MEDIA-21817-EVIDENCE.json. APK bytes were not independently downloaded in the sandbox (Azure artifact redirect host is excluded); artifact digest is not APK checksum. Full SHA256SUMS.txt is included in the artifact.

Controlled tests verify the diagnostic tool, not the contents of the owner's live page. The next meaningful evidence is the owner's pasted report. No PR merge.

Compose reference: https://developer.android.com/develop/ui/compose/documentation?hl=ar
