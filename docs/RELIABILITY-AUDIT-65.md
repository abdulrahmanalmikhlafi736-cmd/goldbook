# Reliability audit after build65 — evidence, not a zero-defects guarantee

## Scope and change policy

Owner requested another broad reliability review. This round reviews lifecycle,
background audio/wake locks, navigation trust, renderer recovery, checkpoints,
video work and actual failed emulator evidence. **All app production files remain
byte-identical to delivered65 (3a9576f).** No new APK/version, theme/filter rewrite,
comment-copy workaround, dependency upgrade or weakened WebView safety check.

## Fresh local checks

-24 DOM regression suites PASS on Node24.22.1/jsdom29.1.1.
- Generated site engine reproducibility check PASS.
- Three Python regression tests PASS: absent/corrupt evidence is not a pass;
  pass/fail/skip classification; native crash context preservation without binary
  minidump noise; lossless bounded chunk transport/roundtrip.
- `npm audit --prefix tools --json`:0 reported vulnerabilities in the development
  npm dependency tree. This is NOT an Android/Maven vulnerability audit, a guarantee
  about unknown vulnerabilities, or proof about the installed WebView provider.

## Historical device evidence actually inspected

Source run41221443278, same build65 previously delivered. Diagnostic workflow
41225861555 downloads its actual test XML and logcat via Actions and emits a
lossless compressed report. This is a NEW inspection of EXISTING device runs,
not a new emulator/device pass. A successful audit workflow means evidence was
retrieved, NOT that the historical tests passed.

| Device / package | Actual WebView | Pass | Fail | Skip |
| --- | --- | ---: | ---: | ---: |
| API29 / debug | 74.0.3729.185 |17|6|6|
| API35 / compact |124.0.6367.219|3|0|0|
| API35 / debug |124.0.6367.219|25|4|0|
| API36 / compact |133.0.6943.137|2|1|0|

Full classified failure details and relevant log context:
`RELIABILITY-AUDIT-65-EVIDENCE.json`.

### 1. High priority: confirmed native WebView browser-process crash on API36

The failing local-page test is not merely an accessibility lookup timeout.
Logcat identifies `com.almekhlafi.FPRO`, thread `Chrome_IOThread`, SIGTRAP, and:

```
[FATAL:partition_alloc_support.cc(770)]
Detected dangling raw_ptr in unretained
/product/app/webview/webview.apk!libwebviewchromium.so
```

The system subsequently force-finishes the Activity. This is a confirmed native
engine failure inside the app's browser process, not a Kotlin exception and not
just a killed sandboxed renderer. Existing `onRenderProcessGone` recovery cannot
promise to catch a fatal signal that terminates the containing app process.

Chromium's official mirrored guide explains that dangling Unretained callback
checks deliberately crash when invoked after the referenced argument is freed:
https://github.com/chromium/chromium/blob/main/docs/unretained_dangling_ptr_guide.md

This identifies the failure mechanism, NOT the exact triggering app call or a
proven version that fixes it. We have not symbolicated the native PC or reproduced
it independently with a minimal WebView activity. Do NOT disable PartitionAlloc
checks, remove tests, label it fixed, or assume it affects the owner's Android13.

Next evidence needed: isolated reproduction of remote->local navigation on the
same emulator/provider, comparison with an officially updated WebView provider,
and native crash attribution before changing application navigation/lifecycle.

### 2. API29 stock emulator uses an obsolete engine

Actual factory provider is WebView74. Logs show unsupported JavaScript syntax and
`Promise.allSettled` missing. Android API level alone does not establish support
for current Facebook or injected modern scripts. Production already warns for
engine majors below80; that is not a universal guarantee for every later engine.

This plausibly explains part of the API29 failures, not all of them conclusively.
Keep these failures visible. A future matrix should distinguish stock old-engine
behavior from Android9 with a maintained WebView provider, not weaken tests or
mistake skipped cases for passes.

### 3. API35 debug failures are not all the deferred Copy issue

Four recorded failures:
- Deferred opaque-comment/native selection assertion (already known; unchanged).
- Production prompt fixture did not finish.
- AMOLED document-start fixture was white instead of black.
- Trusted tap did not start playback in the PiP test.

The compact API35 black-box tests all pass; the separate Android13 prompt/video
checks also pass in prior documented runs. These successes do not invalidate the
four full-suite failures. Fixture/network/timing contamination and a genuine
integration defect remain competing explanations; neither is proven here.

Also note: Facebook CDN JavaScript exceptions occur in the PASSING compact35
job too. Their presence alone does not establish the cause of an app failure.

## Lifecycle/security/resource code review — bounded conclusions

- Header/readiness/position JS probes use SingleFlightQuery; existing unit tests
  cover10,000 unanswered attempts and stale/duplicate callbacks. Do not remove
  this backpressure during optimization.
- Disposed WebViews are held in a WeakHashMap, not a strong permanent registry.
  Disposal disconnects UI callbacks and native playback bridge; automatic
  sandboxed-renderer recovery is limited to one per Activity lifetime.
- Audio-only intentionally keeps WebView alive and holds a partial wake lock
  during playback; pause/destroy paths release it. This is a requested feature,
  not proof of a leak. Long-running physical energy/wake-lock measurement was
  NOT performed.
- Main-frame trust uses parsed HTTPS host checks. Subframe handling, exported
  activities/services, permission denial and explicit Seal handoff were reviewed.
  Browser cookies are not handed to Seal by the active route. No penetration
  test or claim of complete security coverage is made.
- Session checkpoints have bounded bytes/age and atomic persistence. The writer
  uses a single-thread executor without explicit queue coalescing; slow-storage
  accumulation is a risk worth stress-testing, not a demonstrated current leak.
- Audio enable's asynchronous callback does not use the same generation-ticket
  pattern as header/position probes. Navigation/destroy races deserve a targeted
  regression before modifying audio lifetime. This is a code-review risk, not a
  reproduced owner failure or a shipped fix.
- The compact APK is optimized/shrunk but debug-certificate signed by the existing
  build configuration. A future store/release process needs dedicated release
  signing; no user credentials were requested or stored here.

## Remaining open issues / priorities

1. Isolate the confirmed API36 native browser-process crash.
2. Reproduce the API35 full-suite prompt/AMOLED/PiP failures in isolated tests,
   without relaxing assertions or replacing trusted input with synthetic clicks.
3. Investigate the owner's still-unresolved feed return on the actual navigation
   path; synthetic return success is insufficient.
4. Measure sustained video decoder/compositor/background resource use separately
   from DOM operation counts. No physical heat improvement is asserted.
5. Preserve the explicitly deferred comment-copy scope unless owner resumes it.

No claim of all-future-error prevention is possible. Findings are classified so
confirmed defects, suspected risks and environment limitations are not conflated.
Compose UI was not changed; project UI reference remains
https://developer.android.com/develop/ui/compose/documentation?hl=ar .
