# FPRO 🔥 2.18.20 — internal download-link capture

The owner confirmed 2.18.19 downloads correctly. This revision preserves that target selection, official Share/Copy resolution and explicit Seal handoff, while removing the automatic system-clipboard write.

## Scoped changes

- Current-player routes use `copy=0`; native downloader handoff no longer calls `copySource`, even for a stale route requesting `copy=1`.
- Intercept automatic `navigator.clipboard.writeText`, ClipboardItem `write`, copy events/DataTransfer and `execCommand('copy')` before the real clipboard writer. Keep the captured link in transaction memory only.
- Native ClipboardBridge asks the page interceptor before writing or showing the app's copied toast. Modern main-frame/origin-checked messages can supply the fresh link; legacy origin-unchecked messages can only be suppressed during the transaction, not route untrusted links.
- A same-link in-memory receipt absorbs duplicate copy channels for at most two seconds; explicit cancellation or a trusted pointer/key gesture clears it. No clipboard read, restoration, sensitive-preview workaround or persistent clipboard disabling.
- Ordinary manual post copying still uses the original writer. Comment selection restrictions remain. Explicit diagnostic-report copying is still manual and unchanged.
- No changes to current-video targeting, source/identity validation, ambiguity handling, Like, seek, upper fullscreen gesture, homepage prevention, appearance, package or signing. No new idle polling, network interception, chooser or downloader.

## Verification

Apply once to fresh `fe8a474b25414b38819b7cf927720899c8c89705`. Version 2.18.20 / 2180020; original package/signing.

174 local tests passed, zero failures/skips (`dom-results.tap`). Eleven additional cases cover pre-write capture, duplicate channels, ClipboardItem, copy-event/DataTransfer, execCommand, invalid captures, cancellation/manual-copy preservation and native-hook source invariants.

CI requires exactly 29 Android 13 tests. The new foreground test seeds a clipboard sentinel, checks zero clipboard-change callbacks and unchanged content during automatic native capture and handoff, then verifies a subsequent manual copy really writes. Native compilation/execution and owner-account acceptance are pending until CI and owner testing respectively; fixture success is not account proof.

Run: `FACEBOOST_SOURCE=SOURCE JSDOM_PATH=/absolute/node_modules/jsdom node --test integrations/faceboost-2.18.20/*.test.cjs`

The app no longer needs a system clipboard write for the download link. Facebook's own webpage feedback or Seal's independent behavior is not covered by this guarantee.

Compose reference: https://developer.android.com/develop/ui/compose/documentation?hl=ar

### Verification history (pending final run)

Run 42463896778 compiled but exposed a stale copy=1 fixture expectation, stale-player output falling through to normal copying, and Android's asynchronous classification callback for the seeded clip. The expectation now requires copy=0; stale outputs are discarded before writing; measurement starts after seed classification settles, retaining the zero-callback requirement during download. Local tests include stale writeText and ClipboardItem coverage. Run 42464778383 failed at Gradle distribution bootstrap, before compilation; CI now retries bootstrap only, never compilation or failing tests.

Run 42464861250 also failed fetching the Gradle distribution. CI now uses setup-gradle's pinned 9.3.1 installation (the same version as the unchanged source wrapper) rather than the wrapper's failing bootstrap. App compilation/test gates remain mandatory; no failures are bypassed.

Run 42465031734 passed pinned Gradle setup but hit HTTP 504 downloading the Kotlin compiler artifact. CI retries at most three dependency-transport failures; compilation diagnostics and Android assertion failures are not retried or bypassed.

## Owner follow-up: home feed still fails in 2.18.19

Owner clarified successful downloading is inside video/Reel viewers only. Home-feed V2 has attempt stage=0/reason=1/share=0, no extracted IDs, one visible player and 12 unclassified candidates (aria names, label=0). Candidate-cap flag=4 does not prove which action is Share. Geometry/three equal-width actions are NOT enough to choose a button. No raw name is available, so the report does not identify an exact new command or establish a root cause.

Conservative compatibility correction: remove Unicode bidi isolates, Arabic letter mark, zero-width formatting/BOM in the already-recognized explicit Share/Copy names, consistently in routing and diagnostics. This does not recognize unknown controls, infer a command from position, widen ownership, click generic Send, or alter working viewer routing. Formatting is a tested hypothesis, not an observed fact about the owner's names. A screenshot/visible Share caption has been requested before any further command expansion.

Updated local gate: 179 passed / 0 failed / 0 skipped. Updated Android gate: exactly 30 tests, including isolated Arabic Share on the homepage with the production home guard. Native execution and owner home-feed acceptance are pending. The original unchanged-clipboard sentinel/manual-copy test remains required.

Run 42487279110 built successfully and executed all 30 Android cases. The clipboard sentinel/manual-copy case and homepage Unicode-isolate case passed; one pre-existing diagnostic-privacy case timed out at the common harness's `__flush()` callback before its diagnostic assertions. The bounded WebView callback wait is now 30 seconds instead of 10 for slow emulator scheduling; no app logic, assertions, exact count gate, or privacy checks were relaxed. A complete green rerun is still required before delivery.
