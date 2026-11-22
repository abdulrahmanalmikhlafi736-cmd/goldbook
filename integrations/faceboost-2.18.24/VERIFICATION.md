# Verified 2.18.24 delivery

- Application source commit: `f9b2ba2b50a93ec5c3c4334c5aa5d757b88b9f7f`.
- CI: https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42502983907
- build, chromium-fixtures, candidate: all SUCCESS.
- 217 local DOM/gesture tests PASS, zero failures/skips. Native gate requires exact `OK (34 tests)` on Android13. The new Chromium case exercises the homepage Share/Copy flow with visual masking, copy0, late copied status, unaffected error, bounded cleanup and subsequent manual status visibility. Existing strict native clipboard sentinel/zero-callback/manual-copy test is retained.

## Deliverables

- APK bundle: https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42502983907/artifacts/13626747035
  Contains `FPRO-2.18.24-media-candidate.apk`, build-generated SHA256SUMS and TAP.
- Native evidence: https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42502983907/artifacts/13626532193
- Exact source/build inputs: https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42502983907/artifacts/13626492927
  Full project archive: `FPRO-2.18.24-source.tar.gz`.

Artifact existence/metadata and job results were verified through GitHub API. No independent local APK extraction or signature inspection is claimed; artifact ZIP digests are not APK hashes.

## Scope and limits

`source-comparison.json` compares fresh original +23 and fresh original +24. Exactly four generated paths differ: version/code, native tests, media-surface version comment and official-download visual handling. Fourteen critical paths, including native clipboard/download bridges, source resolution and original website scripts, remain byte-identical. 2.18.23's Share/Copy matching and routing are preserved.

The owner confirmed 2.18.23 works. 2.18.24's visual behavior on the owner's exact Facebook markup remains pending; controlled fixtures and CSS property assertions are not logged-in account or pixel-level no-flash proof. Concealment is scoped to recognized new semantic menus and recognized fresh/changed Copy-success statuses. Native manual-copy toasts/errors are not globally disabled. No continuous scan, screenshot allocation or clipboard read/write/restore mechanism was added.

Earlier 24 runs42502226057 and42502898194 were cancelled during development, not counted as verification. Only run42502983907 gates this delivery.
