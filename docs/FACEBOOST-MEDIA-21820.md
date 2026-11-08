# FPRO 2.18.20 — verified candidate; owner home-feed acceptance pending

## Deliverable

App/fixture commit: b7c2e4bd57000afd144255ce51609e46dd3d9a5c.

All three CI jobs passed: https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42488447784

- APK candidate: https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42488447784/artifacts/13620004260
- Android evidence: https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42488447784/artifacts/13621290885
- Build inputs, containing clean inner FPRO-2.18.20-source.tar.gz: https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42488447784/artifacts/13620577664

Candidate ZIP contains FPRO-2.18.20-media-candidate.apk, SHA256SUMS.txt and DOM TAP. The source is the clean inner tar archive, not a claim that the outer build-input ZIP contains source only. Archive size/digest in evidence JSON are NOT APK byte size/SHA. Package com.almekhlafi, version 2.18.20/code 2180020, original signing config unchanged; no independent downloaded-APK signature check claimed.

## Internal capture

Automatic web clipboard APIs are intercepted before writing. The native bridge consults the scoped interceptor before clipboard mutation/copied toast. Legacy origin-unchecked messages suppress only; they cannot supply the link. Download routes use copy=0; native download handoff no longer calls copySource even if a stale route requests copying. Seal receives Intent EXTRA_TEXT. No clipboard read/restore/history, global clipboard disable, internal downloader or chooser. Recycled-player output is discarded, not converted to ordinary copying. Manual copying and comment restrictions remain.

## Owner clarification: homepage is NOT yet confirmed fixed

2.18.19 succeeds inside video/Reel viewers; the owner clarified home-feed download still fails. Their V2 reports stage=0/reason=1/share=0, no ID hits, one visible selected player, and unclassified aria-labelled nearby controls. Candidate-cap flag=4 is not evidence which button is Share. Choosing by geometry would risk clicking Like/Comment.

A conservative compatibility fix removes invisible bidi isolates, Arabic letter mark, zero-width formatting/BOM from already recognized explicit Share/Copy names, in routing and diagnostics. No unknown-control or generic-Send fallback was added; owner/source/ambiguity/bounds checks remain. This fixes controlled Unicode fixtures, NOT an established owner-page root cause. A screenshot or visible Share caption was requested before expanding command semantics. No logged-in owner or Seal UI success is claimed for 2.18.20.

## Verification

179 local tests passed, no failures/skips, against a fresh pinned-original overlay. CI reran the same local suite and built release/debug/test APKs. Android 13 job passed the exact 30-test gate, including:
- Foreground seeded clipboard stays unchanged with zero change callbacks during automatic native capture/handoff, followed by successful real manual copy.
- Recycled-player output cannot route stale links.
- Homepage Arabic direction-isolate Share routes the selected URL with copy=0 under the production home guard.
- Existing gesture, surface, diagnostic privacy and settings regressions.

Earlier 2.18.20 attempts failed; none was delivered as verified. Initial native failures exposed stale route expectations, stale-output fallthrough, and Android's asynchronous seed-classification callback. These were corrected while preserving assertions. Later builds hit dependency HTTP 504 failures; pinned Gradle setup/transport-only retries do not bypass compilation or Android failures. Run 42487279110 built and passed clipboard/homepage fixtures but hit a pre-existing WebView callback timeout before diagnostic privacy assertions. The bounded fixture wait increased from 10 to 30 seconds without changing those assertions; final run 42488447784 passed all 30 cases.

## Preservation

Fresh generated 2.18.19 versus 2.18.20 comparison: 11 changed paths, including tests and version-only files. Media surface differs only in version comment; native diagnostic formatter only version text; Gradle app file only version/code. Manifest, home guard, React/current-video/public-link resolvers and base diagnostic assets are byte-identical. See adjacent comparison/evidence JSON. No unrelated appearance, Like, fullscreen, seek, gesture, identity/signing or source-resolution rewrite.
