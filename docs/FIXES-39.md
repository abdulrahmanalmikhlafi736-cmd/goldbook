# Build39 — fullscreen opens portrait, rotate only after a physical turn

Owner clarified build38: fullscreen must initially stay portrait, not immediately
follow a landscape sensor reading. Normal browsing remains portrait.

- Remove immediate SENSOR orientation at fullscreen entry. Start locked portrait.
- A fullscreen-only OrientationEventListener waits for a portrait reading, then
  a later physical landscape turn before requesting SENSOR_LANDSCAPE. Returning
  upright requests portrait. Ignore unknown/diagonal readings; normalize axes on
  naturally landscape devices. No delayed automatic unlock or website JS bridge.
- If already holding the phone horizontally at entry, it stays portrait; first
  bring the phone upright, then turn it horizontally. No sensor means portrait.
- Stop the listener on pause and remove it on fullscreen exit/destruction; reset
  the gate on every entry. Closing fullscreen restores ordinary portrait browsing.
- No entry/checkpoint/seek/download changes or new permissions.

Local DOM/browsing tests PASS. New pure unit cases cover initial landscape,
unknown/diagonal readings, later turn, re-entry and tablet natural axis. Native
policy test covers portrait entry, ignored initial landscape, later turn and
portrait exit; injected angles test the native policy, not actual sensor hardware.
Build/lint/JVM/DOM PASS: [40245502975](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40245502975).
Native portrait-first policy, history and rotation stress tests PASS on API29/35:
[XML inspection 40246048819](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40246048819).
Full devices [40245502957](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40245502957): **3/4** (API29 debug, API35 compact, API36 compact PASS). API35 debug still fails the existing PiP real-tap playback prerequisite; not claimed fixed.
[Exact API35 tested APK](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40245502957/artifacts/12618851619), ZIP 1,013,233 bytes. App/test source `e5157363650c73bbc6fbbfc450dc4e7757f308c1`.
[Clean complete source](../downloads/FPRO-build39-source.zip).
Platform orientation overrides still apply; real account/sensor behavior needs owner verification.
