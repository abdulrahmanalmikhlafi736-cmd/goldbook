# FPRO 🔥 2.18.15 — identify the selected Facebook player before downloading

## Corrected research scope

The owner clarified that the missing step is obtaining the link FROM the current Facebook video, not downloading a URL already supplied by the user. Version 2.18.14 failed in the owner's account. This revision adds current-player React metadata identification before the unchanged source/official-copy fallbacks and native Seal handoff. It is not a claim of live account success.

## Relevant code actually reviewed

Three MIT-licensed implementations read the current HTML video's owning React metadata:

- [Bluemaster, pinned add-download-video-btn.feature.ts](https://github.com/thuytx03/bluemaster/blob/833e8b365975774fca4938d09eca6f3f49a557d4/src/modules/auto-run/features/facebook/add-download-video-btn.feature.ts): video-bound button closure; parent `__reactProps*`, `children.props.videoFBID` / `coreVideoPlayerMetaData.videoFBID`.
- [Useful Scripts, pinned fb_downloadWatchingVideo.js](https://github.com/Useful-Scripts-Extension/useful-script/blob/d7395352e30d01744c657b5684d4dec212959834/scripts/fb_downloadWatchingVideo.js): parent's React props to videoFBID. Its global first-playing/viewport selection was NOT copied.
- [Bengal Download Manager, pinned facebook-page.js](https://github.com/tazihad/bengal-download-manager/blob/ac78e0397f9163c04d78252331019653f035e2d0/extension/src/sites/facebook/main/facebook-page.js): inspectVideo(video), React props/fiber metadata and watch permalink. Network interception, DASH caches and global video selection were NOT copied.

Excerpts, limitations and MIT attribution: `integrations/faceboost-2.18.15/RESEARCH.md`; production adaptation: `react-video-permalink.js` in the same directory, with MIT permission notices. Unlicensed token/GraphQL code reviewed elsewhere was not copied.

## Applied behavior

Read the exact video passed by its download button, within five owning DOM hosts and eight owning fiber levels. Prefer current owning DOM ReactProps across all bounded hosts before potentially older fiber data. Accept explicit videoFBID metadata, not arbitrary object IDs, account IDs or the page's first Reel route. Construct `https://www.facebook.com/watch/?v=ID`, copy through the existing native route and send to Seal's configured quick-download activity.

Reject conflicting identities/alternates, unsafe numeric IDs, disconnected players, transitions, shared multi-video/feed roots and metadata left over from a previously verified source. The last-successful source/ID baseline updates after every verified resolution, including second-to-third clip recycling. No new idle observer, polling, network hooks, token extraction or whole-feed first-video selection.

If these internal Facebook fields are absent, inherited fallbacks can still fail. React internals are unofficial and the upstream extensions are not proof of support in the owner's mobile layout. Private/restricted videos and Seal's own extraction support remain separate constraints.

## Build and evidence

- App/test commit: `d7ebadafeb0cabf1ade7095e891d4a95a86496be`.
- Fresh original source: `fe8a474b25414b38819b7cf927720899c8c89705`.
- Version `2.18.15` / `2180015`, package `com.almekhlafi`, inherited signing and identity.
- [Successful workflow, all three jobs](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42454724174).
- [APK candidate archive](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42454724174/artifacts/13607571508): `FPRO-2.18.15-media-candidate.apk`, SHA256SUMS.txt and local TAP. Archive size 3,067,496 bytes is NOT APK size.
- [Exact source/build inputs](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42454724174/artifacts/13606724732): full clean project in `FPRO-2.18.15-source.tar.gz`, alongside the build inputs/APKs.
- [Android instrumentation evidence](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42454724174/artifacts/13606839939).
- **123 local passes, zero failures/skips**, including 18 new identity cases; freshly applied source and latest fixture verified locally.
- **24 Android 13 passes**, exact OK (24 tests) gate, including two new actual-WebView cases: correct target among multiple videos/current parent props over stale fiber, and stale reused-source rejection/recovery/alternate conflict.
- Earlier runs 42452901529 and 42453784179 failed an inherited Compose/DataStore persistence fixture. Extending its timeout alone did not fix it. Final test observes actual persisted values off the UI thread and advances the Compose test clock while waiting. Both persisted OFF/ON snapshots and model assertions remain; no production settings were changed or test skipped.
- Seven changed source paths versus 2.18.14, including two test files. Eleven critical runtime files are byte-identical; media controller body is identical except version comment. Hashes/path comparison in `FACEBOOST-MEDIA-21815-SOURCE-COMPARISON.json`.

API artifact digests and job conclusions are recorded in `FACEBOOST-MEDIA-21815-EVIDENCE.json`. Sandbox downloads cannot follow the artifact redirect to Azure blob storage, so APK bytes/checksum were not independently downloaded here; GitHub's artifact-archive digests are explicitly not APK hashes. SHA256SUMS.txt is included in the published archive.

These are controlled fixture tests, not logged-in Facebook acceptance or an installed Seal UI test. No guaranteed one-tap/all-account or zero-lag claim. No unrelated root application edits or PR merge.

Compose reference: https://developer.android.com/develop/ui/compose/documentation?hl=ar
