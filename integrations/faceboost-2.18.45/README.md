# FPRO 2.18.45 — remove automatic comment sorting

Rebuild the pinned original with `python3 integrations/faceboost-2.18.45/apply.py PROJECT`.
Application changes relative to 2.18.44: omit the entire automatic-comments extension, its persisted option, settings strings/UI, document-start registrations, native navigation callbacks, JavaScript engine, diagnostic bridge/UI and diagnostic assets. Existing stored preference values are inert: no code reads them. Facebook’s own comments and manual sorting remain unchanged.

All unrelated overlay inputs are retained byte-for-byte from 2.18.44. Native media fixtures and settings wiring use the pre-feature 2.18.34 harness; feature-specific tests are replaced with removal assertions.

No other performance or UI changes. VersionName 2.18.45 / versionCode 2180045, same identity/signing.
