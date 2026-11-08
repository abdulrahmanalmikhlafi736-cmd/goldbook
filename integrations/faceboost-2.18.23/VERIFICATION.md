# Verified 2.18.23 delivery

- Application source commit: `24855ebf3e56e0a93623fc5da60b5761fe8a08b2` (production repair `4037aad67c27aa9c6f6867a6d06ef099cc29c95b`, followed by test-only synchronization).
- CI: https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42499284078
- build, chromium-fixtures, candidate: all SUCCESS. Native gate requires exact `OK (33 tests)` on Android13; local DOM/gesture tests: 204 PASS, no failures/skips.
- APK bundle: https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42499284078/artifacts/13625181278
  Contains `FPRO-2.18.23-media-candidate.apk`, build-generated SHA256SUMS and TAP.
- Native evidence: https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42499284078/artifacts/13625490643
- Exact patched full source/build inputs: https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42499284078/artifacts/13625102006
  Full project archive: `FPRO-2.18.23-source.tar.gz`.

Artifact metadata queried via GitHub API; no local APK extraction/signature verification is claimed. The artifact ZIP digest is not the APK digest. Application identity, signing configuration and download/clipboard native bridges are preserved in source.

`source-comparison.json` records 22→23 comparison against fresh applications of each overlay to the same pinned original. Five generated source paths differ: version/code, native tests, media-surface version comment, official Copy matching, bounded native diagnostic counters. Thirteen critical paths remain byte-identical. Source and test evidence establish the controlled regression repair, not successful operation on the owner's exact account DOM. Owner confirmation remains required.

Failed run42498141848 is retained in history. Rerun synchronization changes wait for real window focus/seed classification and atomically drain/read the idle queue, keeping clipboard equality, zero callbacks, manual copying, runaway-frame bound and exact33-test gate intact. No production workaround was introduced for test failures.
