# Build40 — unblock fullscreen rotation after entry

Owner confirms portrait entry now works, but physical rotation does not. No
hardware trace proves the exact trigger. Build39 imposed a portrait-angle
prerequisite and a window-focus guard before it would request landscape; either
can prevent a fullscreen custom view from ever releasing portrait.

Replace that policy with a one-shot, axis-independent movement gate:

- Fullscreen still starts PORTRAIT. Ignore the first valid sensor pose.
- Ignore unknown readings and jitter; after a circular change >=45 degrees from
  the entry pose, request Android SENSOR orientation, not SENSOR_LANDSCAPE.
- No exact upright sample, natural-display axis inference or focus prerequisite.
- Immediately remove our listener/gate after unlock; Android handles landscape
  and portrait naturally from then on. Exit always restores ordinary portrait.
- Keep per-entry reset, stale-listener identity check and pause/exit cleanup.
  No new permissions, timers, UI controls, checkpoint/entry/seek/download changes.

Local DOM and browsing tests PASS. Pure unit cases cover arbitrary initial
poses, initial jitter, both turn directions, zero-degree wrap and fresh re-entry.
Native policy test injects an initial landscape pose, jitter and a later turn
without any exact portrait reading, then checks SENSOR and portrait-on-exit.
These are policy tests, not evidence of the owner's physical sensor.

Build/lint/JVM/DOM PASS: [40246487870](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40246487870).
Native policy/history/continuity tests PASS API29 and API35, confirmed by
[XML inspection 40246992551](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40246992551).
Full matrix [40246487948](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40246487948): **2/4**. API35/36 compact PASS; both API29/35 debug fail the real-tap playback prerequisite in the PiP test. Neither failure is counted as a success or claimed fixed.
[Exact API35 tested APK](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40246487948/artifacts/12618674197), ZIP 1,013,001 bytes; source `ace2c796c949cb8739deb18ca65cbcf809b6bec2`.
[Clean complete source](../downloads/FPRO-build40-source.zip).
The existing explicit native diagnostics now include only bounded in-memory
orientation request, sensor capability, last angle and gate/fullscreen booleans;
no motion log, persistence or upload. Actual account/hardware confirmation remains
necessary.
