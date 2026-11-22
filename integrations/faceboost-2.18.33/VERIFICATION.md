# Verified 2.18.33 painted progress thickness

Commit:b067cd06c6314c22c69dba24ce75e1bf291130ab.
CI:https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42593165696
All three jobs SUCCESS.256 Node cases PASS; exact50 Android13 cases PASS, retaining all49 previous regressions.

- APK:https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42593165696/artifacts/13662703455
- Native evidence:https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42593165696/artifacts/13662558738
- Build inputs and full FPRO-2.18.33-source.tar.gz:https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42593165696/artifacts/13662568219

Status/artifact metadata verified with GitHub API. No independent local APK extraction/signature inspection claimed. No PR merge performed.

## Exact change

The owner clarified thickness, NOT horizontal length. Existing fill layout height3 CSS px remains3; the rainbow background is non-repeating, centered and painted at1.5px. Ball18px box/font14px/top-7.5px, accepted bottom4px, track width/position and32px hit area are unchanged. There is no physical-centimeter calibration claim.

New Node case asserts background sizing/repeat and retained ball/touch styles. New actual WebView case loads the original .fpro-fill/.fpro-ball CSS rules from generated facebook.js and checks native computed1.5px paint, centered background,3px fill box,4px bottom,18px ball/font14px,32px track and measured shared ball/fill center. This verifies renderer geometry, not owner-device visual acceptance.

Fresh32/33 comparison has four changed paths: version metadata, native fixture, media-surface version comment/three background longhands and diagnostic version title. Twenty-five critical paths remain byte-identical, including accepted image saving,31 profile/page Share matcher,32 Story source/dispatcher and native external downloader, hold cleanup and developer footer. Source hashes are in source-comparison.json. No download, playback, gesture, observer or timer behavior changed. Owner visual confirmation pending.
