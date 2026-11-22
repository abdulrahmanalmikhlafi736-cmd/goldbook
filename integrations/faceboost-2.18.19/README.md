# FPRO 🔥 2.18.19 — repair the observed mobile Share label rejection

Owner returned two actual V2 reports. In both, a single broad aria Share-like candidate has role=button, data-action-id and data-mcomponent, relation=0, ownerLevel=4, via=3, oldSelector=1, oldBounds=1, portalBounds=1, but oldLabel=0. Current and old visibility counts both equal one; neither opacity visibility nor the selector/bounds check explains this candidate's rejection. No ID fields/React metadata were detected in the examined scope. The exact label text/prefix is deliberately absent from these privacy-preserving reports; do not pretend it was observed.

This build restores the actual video download action (no longer diagnostic-only). Keep the existing current-player ID path if available; otherwise run official Share -> fresh Copy link -> native clipboard and explicit Seal handoff. No CDN/media source fallback.

## Narrow repair

- Keep legacy exact Share labels unchanged. Add descriptive accessible names ONLY for a role=button carrying both mobile action/component attributes, at most 100 characters, within the passed video's single-video ancestor, existing bounds and unique-candidate checks.
- Accept explicit Share/مشاركة/شارك command prefixes. Send/إرسال must explicitly mention a video/reel/post; generic send-message-to-author is not accepted. Do not broaden to arbitrary post text or unlabelled icons.
- Do not accept the broad extension via unproven global portal ownership or multi-video ancestors. Canonical action mapping must remain within the examined owner. Multiple matching actions fail closed.
- Support mobile Copy-link action attributes/descriptive aria names after the fresh selected Share action; deduplicate nested wrappers referring to the same recognized copy action. Existing pre-opened-sheet, ambiguous-copy, source/page/gesture invalidation, timeout and fresh-clipboard safeguards remain.
- If the attempt fails, open the existing local V2 diagnostic dialog with a numeric `attempt` object. No raw label/action values/link is exported. Only explicit Copy report writes diagnostic text to clipboard; no automatic report upload. Standard failure toast remains if report capture is unavailable.
- No Like/fullscreen/gesture guard changes, idle polling, network interception, token access, internal downloader or chooser. Separate story-image route stays unchanged.

## Failure telemetry

`attempt.stage`: 0 started/no selected Share, 1 Share selected, 2 Share click returned, 3 Copy selected, 4 Copy click returned, 5 fresh Facebook link accepted. A returned click is NOT proof the website opened a sheet. Stage is monotonic across synchronous copy callbacks.

`attempt.reason`: 0 none/unknown, 1 Share not found/ambiguous, 2 pre-existing copy sheet, 3 copy timeout, 4 ambiguous fresh copy actions, 5 Share click exception, 6 Copy click exception. `share`/`copy` are selected-action flags; `invalid` counts rejected copy values, never their content. Native formatter independently allowlists/caps these numbers.

Native failure report title now says report of download attempt, not diagnostic-only build. V2 metadata/candidate code mappings remain documented in 2.18.18 README.

## Verification

Apply once to fresh fe8a474b25414b38819b7cf927720899c8c89705. Version 2.18.19 / 2180019; original package/signing.

163 local tests; exact 28 Android 13 cases required. Nine new local tests validate descriptive mobile commands on Reel/non-Reel routes, required footprint, text-only rejection, ambiguity/foreign/portal rejection, mobile Copy, wrapper deduplication, failure reports and explicit-video Send versus message commands. Native added case loads the production gesture guard and actual routing/official-copy assets, then verifies fresh current Facebook share URL exactly once with empty media. Controlled descriptors are examples matching reported categories, NOT the owner's undisclosed label text.

No logged-in owner acceptance or installed Seal UI success claim. This fixes an observed rejection condition; remaining Facebook action/menu/permission differences may still require the numeric failure report. It is not a guarantee of account success.

Local: FACEBOOST_SOURCE=SOURCE JSDOM_PATH=/absolute/node_modules/jsdom node --test integrations/faceboost-2.18.19/*.test.cjs
Compose reference: https://developer.android.com/develop/ui/compose/documentation?hl=ar
