# FPRO 🔥 2.18.10 — optional home swipe guard

User selected the home Create Story swipe prevention feature (not seek isolation)
for a saved toggle inside the golden FPRO engine settings, and requested the
visible application name FPRO 🔥. Package/signing remain com.almekhlafi/original.

## Implementation

- New DataStore boolean fpro_home_swipe, default ON to preserve previous behavior.
  Initial preference is read before creating the WebView; the SettingsViewModel
  flow is subscribed by both native page and settings UI.
- The Arabic switch appears inside the GOLDEN ENGINE section, independently of
  its master switch, and persists immediately. No reload is required for this
  option: native state updates both the current document and future document-start
  scripts. Old registrations are removed/replaced, never accumulated. The handle
  is owned by a WebView tag, not a global map retaining Activities.
- The regular engine config carries the preference for the fallback path. Native
  state is authoritative so a cached older engine bundle cannot reverse OFF to ON.
  Finished-document synchronization also covers unsupported early-injection WebViews.
- OFF disables only ordinary home swipe interception. Owned seek gesture isolation
  remains active, including cancellation and dual input routing. Like, footer,
  fullscreen and all media controller code remain unchanged except version comment.
- All localized app_name resources use FPRO 🔥; settings headings replace only
  old brand names. Upstream attribution/legal mentions and the icon are retained.

## Validation

52 local DOM/integrated/contract cases. Ten controlled Android 13 WebView/native
fixtures are required by CI, adding live OFF/ON, boot OFF with seek still isolated,
DataStore persistence via a new wrapper instance, installed application label and
Arabic option text checks. Inspect actual workflow status before claiming success.
No claim of automated tapping of the real Compose switch or account acceptance.

The owner has not yet explicitly confirmed the 2.18.9 story workaround on their
account. This release adds choice; it does not assert a universal new story fix.
No full inherited unit/lint/thermal/security certification is claimed. Unsupported
WebViews still have a late script fallback and cannot guarantee early precedence.

Apply once to clean pinned source fe8a474b25414b38819b7cf927720899c8c89705:
`python3 integrations/faceboost-2.18.10/apply.py /path/to/source`

With jsdom@26.1.0:
```
FACEBOOST_SOURCE=/path/to/patched-source JSDOM_PATH=/path/to/jsdom \
node --test integrations/faceboost-2.18.10/*.test.cjs
```

VersionCode 2180010. GPL-3.0-or-later. Compose standing reference:
https://developer.android.com/develop/ui/compose/documentation?hl=ar
