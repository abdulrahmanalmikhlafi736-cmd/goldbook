# Build64 video workload investigation — not a thermal diagnosis or fix

## Request and scope

Owner reports heat mainly while watching video, possibly present in older builds
but recently more noticeable. Inspect before modifying confirmed prompt hiding,
touch behavior, media controls, PiP or background audio. Feed-return is still
owner-reported broken; this investigation does not resolve it.

All production sources and version remain byte-identical to
`fd98e31a428127e316a010789e707b50ff0b096c` (build64). Only a development audit and
its evidence/report are added. No new APK, release, merge or production fix.

## Executed experiment

Node24.22.1/jsdom29.1.1, actual combined production scripts, synthetic watch page
with one video element and 120 feed cards containing inline color declarations.
Warm-up1800ms;12 updates250ms apart, then350ms settling. Progress scenario emits
simulated `timeupdate` events and changes currentTime; site-clock scenario writes
a text node outside FPRO controls. Idle makes no such writes. Every case gets a
fresh document. Initialization/disposal are excluded; result counters are deeply
copied before teardown so later observer delivery cannot mutate the evidence.

Instrumentation counts querySelectorAll calls and returned matches (including
repeat matches), computed styles, rectangles, mutation callbacks/records, and the
main engine's full-scan counter. Callback stacks identify the registered observer.

| Scenario | Queries | Returned matches | Observer callbacks | Main full scans |
| --- | ---: | ---: | ---: | ---: |
| Idle, tools on, natural color | 0 | 0 | 0 | 0 |
| Progress, tools on, natural color | 0 | 0 | 36 | 0 |
| Progress, tools off, natural color | 0 | 0 | 0 | 0 |
| Progress, tools on, gold | 96 | 1488 | 48 | 0 |
| Site clock, tools on, natural color | 32 | 4 | 54 | 2 |
| Site clock, tools on, gold | 144 | 1740 | 68 | 2 |
| Progress, adblock enabled, natural color | 0 | 0 | 36 | 0 |
| Progress, enhancements off | 0 | 0 | 0 | 0 |

These are counts in this fixture, not Android CPU percentages or thermal results.
The 1488 matches are repeated query results, not 1488 distinct elements.

## Confirmed unnecessary work

`facebook.js` attachVideo/progress updates the fill, seek state, clock text and
transport labels on video events. Its own general mutation observer filters the
`.fpro-video-tools` subtree. However, the imported material color observer in
`site-engine.js` watches the document element's subtree for child/style changes
and calls `processMaterialYouStyles()` without inspecting record targets.
That method runs document-wide inline style queries, even when the only change
was inside FPRO's own video controls. In the gold case,12 progress events invoked
this observer12 times, causing96 query calls and1488 returned matches. This path
exists before build63/64; it is not introduced by the feed-return helper.

The prompt and general observers also receive owned progress mutations, but in
the natural-color progress case no measured query/style/rectangle/full-scan work
occurred. Do not blame the owner-confirmed prompt fix simply because its observer
was delivered records. Adblock did not add queries in this particular fixture.

## In-memory isolation, NOT a shipped change

`--candidate` changes only the evaluated string in the audit harness: skip the
material color pass if every record target is within `.fpro-video-tools`.
No asset on disk is changed. Result:

- Gold/progress: **96 ->0 query calls;1488 ->0 returned matches**. Observer
  callbacks remain48: this does not eliminate observer delivery or video rendering.
- Gold/site-clock: still128 queries and1492 returned matches; main scans still2.
  Thus the candidate does NOT suppress arbitrary website updates and does NOT
  resolve all video-related scanning.

This isolates a removable source of work, not an approved complete optimization.
A production fix would need target-scoped website recoloring as well, regenerated
upstream assets and compatibility/native visual checks. It must not remove color
updates, hide controls or disable the verified Open App filter to lower counters.

## Other code review findings and limits

- Header/playback probe repeats roughly every1.2s while focused (650ms when home
  controls are present); position capture runs every15s. Their real-device cost
  was not measured in this audit.
- The normal configuration does not explicitly force software layer rendering;
  the existing `software` preference can request it. Owner's setting is unknown.
  This does not establish which decoder the device actually uses.
- Audio-only mode intentionally keeps WebView visible to continue playback and
  the foreground audio service holds a partial wake lock while playing. This is
  an existing requested feature, not proof of a leak during ordinary video.
- No local Android emulator/adb was available. This turn did NOT measure real
  video decode, Chromium renderer CPU, GPU/compositor load, video frame loss,
  network adaptive bitrate, power use, battery drain or physical temperature.
  Simulated play state does not mean real media was decoded.
- FPRO's rotating ball animation and backdrop blur may have compositor cost;
  jsdom cannot quantify it, so no savings claim is made.
- Golden theme is an explicit test configuration, not a claim about the owner's
  selected theme. The actual cause or share of device heating remains unknown.

## Reproduce

```sh
.cache/node24/node_modules/node/bin/node tools/audit-video-workload.cjs
.cache/node24/node_modules/node/bin/node tools/audit-video-workload.cjs --candidate
```

Full evidence: `VIDEO-WORKLOAD-64-COUNTS.json` and
`VIDEO-WORKLOAD-64-CANDIDATE.json`. No runtime/private account information is stored.
