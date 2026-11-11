# Video download cleanup — source implementation, not release verified

Requested boundary: explicit download button -> owned Facebook Share -> fresh official Copy link -> existing targeted external-download UI. No React ID extraction, guessed permalink, native-share interception or direct Story MP4 bypass.

Implemented in the generated application:
- player-post-download.js delegates exclusively to official-download.begin(video).
- public-video-link.js contains only the pure copied-URL validator.
- No download resolver calls from video onAttach.
- Removed legacy React/current-source/Story video/diagnostic JS assets and injection entries.
- Removed native PlayerDiagnostic class/route, unused native copySource and Story MP4 resolver. Legacy story-video requests fail closed. Image handling preserved.
- Removed the navigator.share override; Copy is required, not optional.
- Official transaction keeps existing bounded observer, timeout, cancellation, copied-result guards and short post-copy veil/receipt cleanup to prevent site Copy toast/clipboard leakage.

Focused gate: 81 official-download tests passed, including idle (no observer/timer/clipboard reads), current-player Share/Copy, timeout, cancellation, stale video, ambiguous actions, silent capture, and entrypoint bypass rejection.

Limitations / remaining release work:
- Existing generic manual-copy bridge hooks remain installed; at idle they perform only a state check, not video discovery/scanning/network/clipboard reads. Therefore do not describe this as literally zero executed instructions outside the click.
- Historical migrations in apply.py still reconstruct intermediate code before final cleanup. Historical overlay files remain as build/test history; they are not injected/shipped as the removed assets.
- Full legacy DOM/native fixture suite still expects the removed resolver/diagnostic/Story behavior and requires migration to the new contract before using the workflow as a release gate. The old 258-test result no longer describes this modified source.
- No APK/Android emulator verification or account-level Share/Copy verification performed for this cleanup. Not release-ready yet.
