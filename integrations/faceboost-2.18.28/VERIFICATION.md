# Verified diagnostic 2.18.28 — photo failure still unresolved

Commit:d088c1b37f5e8c56683f8b24caa854ebbc4123ab.
CI:https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42514790612
build/chromium-fixtures/candidate all SUCCESS. 233 local tests PASS. Exact40 Android13 tests PASS, retaining39 and adding reason/category/redaction/strict-validation checks.

- APK:https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42514790612/artifacts/13631436566
  FPRO-2.18.28-media-candidate.apk, generated SHA256SUMS and TAP.
- Native evidence:https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42514790612/artifacts/13631411549
- Source/build inputs:https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42514790612/artifacts/13631295712
  Full archive FPRO-2.18.28-source.tar.gz.

Metadata and CI results verified through GitHub API; no independent local APK extraction/signature inspection claimed. ZIP hashes are not APK hashes.

Owner screenshot27 proves a download callback is rejected, but not why. This build changes only failure reporting, not acceptance, fetching, storage, cookies or held-playback handling. Four generated paths differ from27: version/code, native test, media-surface version comment and ImageDownloads diagnostic UI/method. Twenty-one critical paths remain byte-identical, including native hold cleanup and raw gesture script, official Share/Copy concealment, clipboard/Seal, settings/contact.

The diagnostic returns fixed reason codes1–5 and public MIME/host-family/suffix enums, never raw URLs, hostnames, query values, IDs, cookies or filenames. Native tests use secret sentinels and confirm they are absent; application/octet-stream remains rejected. Actual Android storage PNG roundtrip remains green, but is not the owner's Facebook Save action. The owner must send the dialog screenshot to identify the gate before a targeted repair. Do not present28 as a completed Save fix.
