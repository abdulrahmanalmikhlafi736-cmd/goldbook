# 2.18.37 verification — complete controlled gate

App source: 4a2f7bac07586003c2fa9ead6aa3ce2022b249e8. Fresh applied source passes 280 Node cases. Three focused regressions fail with the 36 controller and pass with 37.

Final run: https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42641552341 at59f6afcfca3abff469a2cfe19e6c9772fc8990ae (documentation-only change after app source4a2f7ba). All three jobs SUCCESS; 280 Node tests and exact `OK (56 tests)` Android13 gate PASS. No tests/assertions were removed or relaxed.

- APK: https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42641552341/artifacts/13686107755
- Native evidence: https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42641552341/artifacts/13685942824
- Build inputs/full FPRO-2.18.37-source.tar.gz: https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42641552341/artifacts/13685648335

Status and artifact metadata checked through GitHub API. No independent local APK signature extraction claimed. No PR merge performed.

## Initial unsuccessful attempt

Initial run https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42639178768 built successfully but its 56-test Android13 gate FAILED: 3 existing clipboard-related cases could not obtain Activity window focus (two awaitActivityFocus assertions and one Compose focus timeout). The new composer-zero/radio-sheet case was not among failures. No APK candidate was published. This is NOT a passing release.

Failed-job rerun request was rejected by GitHub (`cannot be rerun; its workflow file may be broken`). The next documentation push requested a fresh complete run of the unchanged code and unchanged 56-test gate, not a subset or weakened assertion. No product change is justified solely by a runner focus failure. The unchanged full run subsequently passed. The precise initial focus failure cause is not established; this result does not justify a product or harness change.

Source comparison: 7 generated paths differ from 36; 23 critical paths are byte-identical. Progress differs only in its version header. Default-OFF preference, existing settings/cache, media, downloads and signing retained.

Owner-account sorting success is unconfirmed. Controlled fixtures are not authenticated Facebook evidence.

If owner sorting still fails, leave the official menu open about8 seconds with the option ON, then settings → المحرك الذهبي FPRO → تشخيص خيار التعليقات → نسخ التقرير. The new numeric stage/reason counters distinguish opener, radio, checked-state and confirmation stages without exposing content.
