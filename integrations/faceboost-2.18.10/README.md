# FPRO 🔥 2.18.10 — optional home-swipe guard + visible app name

The owner selected **home Create Story swipe prevention**, not seek isolation,
when asked which behavior should become optional. Add one normal SettingsItem
inside the existing Golden FPRO engine section. Do not merge the two switches or
claim 2.18.9 account acceptance (not reported).

## Behavior

- New DataStore key `fpro_home_swipe_block`, default **true** to preserve the last
  delivered behavior. SettingsViewModel initializes from saved preferences and
  exposes the usual StateFlow + setter; the existing settings row persists it.
- Row stays accessible inside the engine section even with its master off, since
  home prevention is independent. Arabic title: «منع فتح إنشاء قصة بالسحب في الرئيسية».
- Toggling applies to the current document WITHOUT reload, and replaces the one
  document-start registration for future navigations. Registration is held on the
  WebView itself (resource-id tag), not in a process-global reference map.
- Script-bundle fallback receives the current native value before execution,
  avoiding stale cached engine settings on old WebViews. No new polling/bridge.
- OFF disables only generic home-page swipe prevention. Owned progress gestures
  remain isolated, including while OFF. Pending generic gestures reset on toggle.
- All 12 localized app_name definitions become exactly **FPRO 🔥**; relevant
  branding strings use the same name. Package `com.almekhlafi`, namespace,
  application data, signing, icon, upstream attribution and licenses stay unchanged.

No Like, seek implementation, footer geometry or fullscreen policy changes: media
helper differs only in its first version comment; raw gesture snippets are retained.
Version 2.18.10 / code 2180010. App update, not a separate installation.

## Validation

52 local policy/DOM/production-script/wiring tests pass. CI requires 12 Android 13
instrumentation cases: 8 inherited cases, live/future-document toggle with seek
isolation retained, DataStore + recreated ViewModel persistence, localized launcher
label + package identity, and an actual Compose settings-row click OFF/ON (even
with master OFF). The Compose test renders the production SettingsContent and
checks persisted changes; it is not a placeholder UI.

Check actual run status before calling native tests successful. Browser events are
controlled/synthetic, not logged-in account or physical-swipe acceptance. Preference
and UI tests do exercise real Android/Compose/DataStore. No full inherited unit/lint
suite, thermal or universal no-lag guarantee, or local APK certificate inspection.

Apply to clean pinned source fe8a474b25414b38819b7cf927720899c8c89705:
`python3 integrations/faceboost-2.18.10/apply.py /path/to/source`

With jsdom@26.1.0:
```
FACEBOOST_SOURCE=/path/to/patched-source JSDOM_PATH=/path/to/jsdom \
node --test integrations/faceboost-2.18.10/*.test.cjs
```

Standard Compose state-driven row, following the existing project pattern.
Standing official reference:
https://developer.android.com/develop/ui/compose/documentation?hl=ar

GPL-3.0-or-later; preserve upstream attribution.
