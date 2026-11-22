# Verified 2.18.32 Story-only current MP4 handoff

App commit:cd615dbf729371b81043dd5bdfe216c3581355e8.
CI:https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42547060526
All three jobs SUCCESS.255 Node cases PASS. Exact49 Android13 cases PASS, retaining all47 previous cases.

- APK:https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42547060526/artifacts/13644311898
- Native evidence:https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42547060526/artifacts/13643488830
- Build inputs and full FPRO-2.18.32-source.tar.gz:https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42547060526/artifacts/13644142091

GitHub status and artifact metadata verified by API. No independent local APK extraction/signature inspection claimed; no merge performed.

## Evidence

Owner31 Story report establishes sourceKind2 (HTTPS fbcdn), sourceAgreement1, one selected visible video/two document videos and no successful Share selection. It does NOT establish the actual page pathname, MP4 extension, CDN accessibility or Seal extraction success. The Story exception is intentionally restricted to Facebook /stories/... or /stories.php, exact current HTTPS fbcdn MP4, top frame, own document and one visible video. A nonempty currentSrc/src mismatch rejects the transition. No arbitrary ID/link, reaction button, first-playing video or global metadata is used.

Nine new Node cases exercise exact signed query preservation, hidden earlier video, newly advanced source, normal-feed/profile/Reel/story.php exclusion, host/page/media restrictions, transition mismatch, hidden/detached/ambiguous players, subframe rejection and actual production player delegation before metadata/Share.

Two new real-WebView/native tests check exact selected Story MP4 custom-route transfer with twelve unrelated reaction buttons and a hidden earlier video; no Share/Copy/reaction executes. Native validation yields the same exact URL and the existing ACTION_SEND text/plain package-targeted Seal intent carries that URL. Negative native page/CDN/credential/port/manifest/chunk/fragment cases reject; ordinary publicFirstSource still rejects direct media; a stale currentSrc cannot authorize the new src. These are controlled source/intent tests, not actual remote file-byte retrieval or owner-account proof. The existing configured QuickDownloadActivity resolution/handoff code is unchanged.

## Preservation and limits

Eight generated paths differ from31: app version, Android test fixture, media-surface version comment, player dispatcher, new Story asset, asset loader, native Story-only source gate and diagnostic version title. Seventeen previously tracked critical paths remain byte-identical. All four accepted photo-save source files and31 profile/page Share matcher are byte-identical; source-comparison.json records hashes. All47 prior Android tests pass, including image byte roundtrips/publication, native clipboard and held-playback/UI contracts.

No production polling/observer, network fetch/interception, cookie/header export or automated clipboard write added. The existing configured external downloader remains responsible for fetching the expiring media URL. Blob/DASH/other Story formats and Story overlays outside the guarded URL routes are not newly supported; they retain the existing safe fallback/diagnostic. Owner acceptance remains pending.
