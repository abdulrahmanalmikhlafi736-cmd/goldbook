# Build38 — portrait for normal browsing only

Owner explicitly revised the rotation requirement: disable rotation in ordinary
browsing and stay portrait. The launcher Activity now declares portrait. Only
entering native full-screen video temporarily requests sensor orientation;
leaving that view restores portrait. No settings toggles, reloads, orientation
polling, seek changes or checkpoint changes are introduced.

The build37 explicit-orientation fixture remains a stress test of document
continuity; its programmatic orientation override is not normal browsing policy.
A separate native test checks default portrait → full-screen sensor → portrait
and callback release. It invokes native full-screen callbacks with a fixture
View, not a claim of decoded Facebook video or physical sensor testing.

Local DOM/browsing regressions PASS, including portrait manifest and scoped
full-screen orientation policy. Android build/lint/JVM/DOM PASS: [40244103164](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40244103164).
Native policy test, position/history and explicit-rotation stress tests PASS on
API29 and API35, confirmed by [XML inspection 40244661500](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40244661500).
Full devices [40244103108](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40244103108): **2/4**; API29 debug and API35 compact PASS. API35 debug fails existing PiP tap-start prerequisite; API36 compact fails local HTML access assertion. Not claimed fixed.
[Exact tested API35 APK](https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40244103108/artifacts/12618032384), ZIP 1,012,528 bytes. App/test source `6b85e1ee3e2ad46730cf5ed7e7f500d7b9b24270`.
[Clean full source ZIP](../downloads/FPRO-build38-source.zip).

Android large-screen / system overrides of requested orientation remain platform
policy; the app does not fake a portrait viewport on landscape displays.
