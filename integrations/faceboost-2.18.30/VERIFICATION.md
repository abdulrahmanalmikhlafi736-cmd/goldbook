# Verified 2.18.30 controlled image regressions

App commit:50bd977e54645a89413bc954d98c4e809522365e.
CI:https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42521578935
All three jobs SUCCESS.243 local tests PASS and exact45 Android13 WebView/settings cases PASS.

- APK:https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42521578935/artifacts/13634335775
- Native evidence:https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42521578935/artifacts/13633424610
- Build inputs and full FPRO-2.18.30-source.tar.gz:https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42521578935/artifacts/13633299921

Verified through GitHub status/artifact API. No independent local APK extraction/signature inspection claimed. No merge performed.

The new real-WebView revoked-Blob case revokes the exact created object URL, replaces fetch with a throwing function, consumes the retained original Blob through the origin-restricted production saver, compares saved PNG bytes and checks IS_PENDING=0. This proves retained-source/no-fetch behavior, not enforcement of an actual CSP policy. Percent-encoded JPEG data also saves byte-for-byte. The existing live-Blob test explicitly consumes the retained reference before invoking the saver, preserving actual fallback-fetch coverage. All other43 previous cases remain gated.

Old29 reader fails the new retained-source/blocked-fetch Node oracle. Owner29 failure still does not establish actual scheme or cause. Owner-account Save success with30 is pending; no guarantee based on fixtures. Retention helps only when the exact Blob was captured within its bounded5-second window; otherwise the existing live fetch fallback remains. Unsupported document-start scripting cannot capture revoked sources and fails safely. Persistent mode/stage/cache diagnostics should identify any remaining issue without URLs or image contents.

Fresh29/30 overlay comparison is recorded in source-comparison.json. Twenty-one previously tracked critical files are byte-identical, including held playback cleanup, official Share/Copy/current-video/Seal logic, settings and developer footer. Accepted progress/ball behavior is untouched. Changed paths are version, native regression fixture, media-surface version label, local image source/reader and native saving diagnostics/validation/publication handling only.
