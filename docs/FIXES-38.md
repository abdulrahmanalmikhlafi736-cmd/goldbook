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
full-screen orientation policy. Android build/native tests pending.

Android large-screen / system overrides of requested orientation remain platform
policy; the app does not fake a portrait viewport on landscape displays.
