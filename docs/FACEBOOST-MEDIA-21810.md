# FPRO 🔥 2.18.10 — optional home swipe policy and app label

## Delivery

- Tested commit `64e0626b13f7b60be0e5e7fe22a6d06fb7ab21c8`.
- Successful run: https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42435953928
- APK: https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42435953928/artifacts/13600135918
- ZIP contains `FPRO-2.18.10-media-candidate.apk`. Install over existing, no uninstall.
- Exact source + test APKs: build-inputs artifact `13600125646`.
- Native evidence artifact `13599663590`.
- Visible release name **FPRO 🔥**; versionCode 2180010.
- Application ID `com.almekhlafi` and original signing configuration retained.

## Requested option

The owner selected HOME Create Story swipe prevention, not range isolation.
Settings → Golden FPRO engine → «منع فتح إنشاء قصة بالسحب في الرئيسية».
The ordinary existing SettingsItem persists `fpro_home_swipe_block`, default ON
for continuity. The row remains accessible when the engine master switch is OFF.

The setting takes effect live, without reload. Native StateFlow changes update the
current page and replace the one document-start registration for future pages.
A WebView-owned resource tag holds its ScriptHandler; no global Activity map or
polling was added. The current native preference is prepended to script execution,
so cached scripts cannot restore a stale value. Unsupported early-script WebViews
retain the late fallback, without claiming early precedence there.

OFF stops generic home swipe interception only. Owned seek control isolation
remains active, independent of this option. Main media implementation, Like,
footer geometry and upper fullscreen policy remain unchanged.

## Branding

All 12 main localized app_name definitions are FPRO 🔥. Relevant brand resources
use the new name, while package/namespace, icon, attribution and licenses remain.
The debug manifest explicitly uses FPRO 🔥 Debug to preserve build distinction;
the debug resource app_name no longer overrides the requested localized name with
Faceboost Debug. Release uses the unchanged main manifest's app_name reference.

## Validation completed

- 52 local policy/DOM/production-script/wiring cases passed on a fresh pinned apply.
- Same suite passed CI; release/debug/instrumentation APKs built (8m54s job).
- All **12 Android 13 tests passed** (3m6s fixture job): inherited eight browser
  regressions; live/future-page toggle with owned seek retained; DataStore plus
  recreated SettingsViewModel initialization; localized app labels/package;
  and the actual production SettingsContent row with master OFF.
- UI automation expands the real initially-collapsed category and invokes its
  registered SemanticsActions.OnClick OFF/ON, then observes persisted changes.
  This is production UI/accessibility activation, NOT trusted physical touch
  hit testing. An earlier coordinate-based click timed out; no root cause is
  claimed for that pointer hit-test failure and no physical-tap certification is
  made. Collapsed-category test setup and old debug label overrides were fixed.
- Emulator action commands are executed per line: diagnostic `if` is kept on one
  line and failed assertions cannot be masked by tee. Failure summaries are bounded
  to fit GitHub annotations. A packaging Java heap OOM was addressed with CI-only
  Gradle heap/worker flags, without changing Android runtime memory settings.
- Publication remained blocked until all twelve tests passed.

## Preservation

Fresh 2.18.9/2.18.10 comparison shows the complete media controller is byte-identical
except its version-comment line. Raw reel gestures (including confirmed Like),
raw reel controls, facebook.js, MainActivity, background-audio WebView and MAIN
manifest are byte-identical. Added differences are setting wiring, guard enable
state/native registration updates, tests and branding resources/debug label.
See `FACEBOOST-MEDIA-21810-SOURCE-COMPARISON.json` and the API evidence JSON.

## Limits

Owner account acceptance of the story workaround was not reported. This release
adds a saved choice and a label; it does NOT claim universal Create Story removal.
Browser fixtures use controlled synthetic events. No full inherited unit/lint
suite, thermal measurement, no-lag guarantee, local certificate check or exact APK
size inspection is asserted. Artifact sizes refer to ZIP archives, not APK sizes.
The one-off isolated UI diagnosis workflow was removed after use.

Standing Compose reference:
https://developer.android.com/develop/ui/compose/documentation?hl=ar
