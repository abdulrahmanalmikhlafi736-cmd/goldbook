# Pinned build/test toolchain

This update changes CI/development dependencies only. Android runtime code,
versionCode55, JDK17, and the pending account-side CTA issue are unchanged.

- `.node-version`: Node24.22.1, installed explicitly by setup-node@v7 (itself
  node24). tools/package.json requires Node>=24.22.1 <25.
- Android build and emulator jobs: ubuntu-24.04, not ubuntu-latest.
- Web tools compatibility workflow runs the SAME15 suites on ubuntu-24.04 AND
  ubuntu-26.04. Ubuntu26 is a compatibility lane, not an untested replacement of
  all Android emulator jobs. Each job reports OS/Node/npm versions.
- Every setup-java use is v5 (node24 action), still installing Temurin JDK17.
  Upgrading the action does not mean upgrading the project's Java language level.
- jsdom26.1.0 ->29.1.1, exact version plus committed npm lockfile. This brings
  @exodus/bytes1.16.0 through the actual upstream dependency tree and removes
  whatwg-encoding entirely. No unsafe npm alias/override and no unused direct
  dependency merely to hide a deprecation warning. Test-only, not in the APK.
- Trial jsdom30.1.3 failed existing54 before-next-frame regression;28.1.0 failed
  existing46 whole-bar regression. These were rejected WITHOUT modifying the
  production classifier or weakening assertions.29.1.1 passes all15 locally on
  Node24.22.1. This records compatibility outcomes, not an upstream root-cause
  diagnosis.

Run `npm ci --prefix tools --ignore-scripts --no-audit --no-fund`, then
`npm test --prefix tools` using the Node version in `.node-version`. The runner
uses process.execPath and discovers all test-*.cjs files, fails on any failure,
and checks syntax of both production JavaScript engines. CI additionally checks
that @exodus/bytes is installed and no whatwg-encoding remains in the lockfile.

CI outcomes must be read from the exact new commit's workflow runs; local pass
is not proof that either Ubuntu hosted lane, APK build or emulator run passed.
Existing build55 source ZIP is historical and is not silently overwritten.

## Verified CI for45f446f

Web tools matrix: **PASS on BOTH Ubuntu24.04 and26.04**, all15 suites and
encoding dependency migration check, explicitly installed Node24.22.1:
https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/40724999086

Android build / emulator jobs run separately; their completion is not implied
by this successful JavaScript matrix. Older checkout@v4 still emits a Node20
metadata deprecation warning despite GitHub forcing its action runtime to24;
this change does not claim every third-party action warning was eliminated.
