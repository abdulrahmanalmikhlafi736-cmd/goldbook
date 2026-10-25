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
Build and device CI pending. Platform orientation overrides still apply.
