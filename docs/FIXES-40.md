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
These are policy tests, not evidence of the owner's physical sensor. CI pending.
