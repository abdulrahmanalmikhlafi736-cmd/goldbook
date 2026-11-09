# 2.18.37 verification — pending full native gate

App source: 4a2f7bac07586003c2fa9ead6aa3ce2022b249e8. Fresh applied source passes 280 Node cases. Three focused regressions fail with the 36 controller and pass with 37.

Initial run https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42639178768 built successfully but its 56-test Android13 gate FAILED: 3 existing clipboard-related cases could not obtain Activity window focus (two awaitActivityFocus assertions and one Compose focus timeout). The new composer-zero/radio-sheet case was not among failures. No APK candidate was published. This is NOT a passing release.

Failed-job rerun request was rejected by GitHub (`cannot be rerun; its workflow file may be broken`). This documentation push requests a fresh complete run of the unchanged code and unchanged 56-test gate, not a subset or weakened assertion. No product change is justified solely by a runner focus failure. If focus failure recurs, investigate the emulator/window evidence before changing the harness.

Source comparison: 7 generated paths differ from 36; 23 critical paths are byte-identical. Progress differs only in its version header. Default-OFF preference, existing settings/cache, media, downloads and signing retained.

Owner-account sorting success is unconfirmed. Controlled fixtures are not authenticated Facebook evidence.
