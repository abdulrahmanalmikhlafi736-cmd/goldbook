# FPRO 🔥 2.18.17 — owner-approved local player diagnostics

This is explicitly a DIAGNOSTIC build, not a claimed download fix. The owner confirms 2.18.16 still ends at Share-not-found and approved collecting a small local report on the real clip. Pressing the existing video download button now opens an Android report dialog with Copy report / Close. It does not start official Share/Copy, send to Seal, copy automatically or upload anything. Other controls and the separate story-image action remain unchanged.

`player-diagnostic.js` inspects the exact passed HTML video, up to eight single-video owning hosts, bounded React props/fiber metadata and small local JSON attributes. It reports only fixed-schema numeric counts, classifications, field/type codes and known-property path codes. No values, actual IDs, URLs, post text, DOM HTML, arbitrary key names, labels, action IDs, cookies, account storage, token values or raw React objects are exported. Descriptor-backed getters are not invoked. Work is on-demand: no timer, idle observer, network access or durable report storage.

`PlayerDiagnostic.kt` independently reconstructs the numeric allowlisted schema from the page payload before displaying/copying. Unknown fields/strings are discarded, counts/codes bounded, schema/row/path/payload sizes validated. Native custom-scheme route checks the current Facebook context. A foreground dialog gives the user explicit copy control; clipboard is marked sensitive on Android 13. Invalid data is not copied; repeated requests replace the previous dialog.

## Report schema v1 (developer decoding)

- route: 1 Reel, 2 Watch, 3 other/feed. source: 0 empty, 1 blob, 2 HTTPS fbcdn, 3 other HTTPS, 4 other.
- sourceAgreement: 0 comparison unavailable, 1 currentSrc/src agree, 2 differ (possible source transition). No source strings are retained.
- topFrame: 0 child frame, 1 top frame. videos: global count capped at 200. limited: a work/data limit was encountered.
- hosts: level 0 = video, 1 = immediate parent. tag: 0 other, 1 video, 2 div, 3 article, 4 section, 5 main, 6 span. props/fiber = React expando counts; store/component/action = known attribute presence flags.
- hits: level, origin (0 React props, 1 fiber props, 2 data-store JSON, 3 data-video-data JSON, 4 data-mcomponent-data JSON); field (0 videoFBID, 1 videoId, 2 videoID, 3 video_id, 4 fbid, 5 id); type (0 null, 1 string, 2 number, 3 object, 4 other, 5 getter); digits = plausible numeric shape only, NOT its value.
- path codes: 0 children, 1 props, 2 coreVideoPlayerMetaData, 3 videoPlayerConfig, 4 videoData, 5 video_data, 6 video, 7 data, 8 node, 9 media, 10 videoDeliveryLegacyFields, 11 array element. No arbitrary property names.
- near: visible nearby buttons, action-bearing nodes, mcomponent nodes, Share-label matches, SVGs and recognized permalink counts. No matching labels, IDs, icon paths or destinations are retained.

Apply once to fresh upstream fe8a474b25414b38819b7cf927720899c8c89705. Version 2.18.17 / 2180017, original package/signing. Preserve accepted progress/seek/Like/entry-only fullscreen, settings/home/CTA/themes/audio. Older helper files/tests remain for regression history; production video button is diagnostic-only.

Local suite: 143 controlled tests. CI requires exactly 26 Android 13 tests, including actual WebView diagnostic payload, native sanitization, origin rejection, report dialog and explicit clipboard button. These are not the real Facebook report: that comes from the owner's clip after installation.

Local command: FACEBOOST_SOURCE=SOURCE JSDOM_PATH=/absolute/node_modules/jsdom node --test integrations/faceboost-2.18.17/*.test.cjs

Compose reference: https://developer.android.com/develop/ui/compose/documentation?hl=ar
