# Verified 2.18.25 delivery

- Application changes: a16ff90169a599bd679d5f1879c5424bb00c168c.
- Verified commit: 8b6c547393949f2a3b4bdb5ff87610f062ac1180 (CI wake/unlock setup only after application changes).
- CI: https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42506017830
- build, chromium-fixtures, candidate: all SUCCESS.
- 219 local tests PASS, zero failures/skips. Native gate requires exact `OK (36 tests)` on Android13.

## Deliverables

- APK bundle: https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42506017830/artifacts/13627981402
  Contains FPRO-2.18.25-media-candidate.apk, build-generated SHA256SUMS and TAP.
- Native evidence: https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42506017830/artifacts/13627945920
- Exact source/build inputs: https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42506017830/artifacts/13627463378
  Full project archive: FPRO-2.18.25-source.tar.gz.

GitHub artifact metadata/job results verified via API; no independent local APK extraction/signature inspection is claimed. Artifact ZIP digests are not APK hashes.

## What is verified

Actual Compose settings footer scroll/visibility/click with captured ACTION_VIEW Intent to com.whatsapp and phone967781764759. Fallback test verifies regular WhatsApp → Business → HTTPS wa.me with the same phone. No claim that an emulator contacted a real WhatsApp account. Existing WebView viewport case checks the actual6px fill offset. All prior Share/Copy concealment, strict native clipboard sentinel/zero callbacks/manual copy and gesture cases remain gated.

Fresh original+24 vs fresh original+25 source comparison records nine changed/new paths: version, two native tests, media surface, settings footer/content/contact utility and two resource files. Fifteen critical paths, including the entire official-download concealment JS and native clipboard/Seal/source code, are byte-identical. The owner confirmed24 works;25's phone appearance and real WhatsApp account opening await owner acceptance.

Initial run42504959436 built but failed three existing foreground clipboard/window-focus cases; no new footer case failure was reported. CI now explicitly wakes the fresh emulator, dismisses keyguard and keeps it awake before tests. No production changes or test assertion relaxations were made in response. The rerun passed all36.
