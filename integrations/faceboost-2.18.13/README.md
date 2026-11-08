# FPRO 🔥 2.18.13 — automatic official Share / Copy, no guessed fallback

Apply once to fresh pinned source `fe8a474b25414b38819b7cf927720899c8c89705` using `python integrations/faceboost-2.18.13/apply.py SOURCE`.

The owner rejected 2.18.12's manual-share instruction. This revision removes both that manual waiting mode and the video download button's direct/permalink fallback: its path must be official Share → official Copy → validated copied URL → native clipboard → Seal quick handoff.

Concrete changes:
- Fix transaction invalidation when an official modal marks its background video aria-hidden. Detach, source/identity/route changes and actual app background still cancel.
- Exclude hidden/offscreen old feed controls before applying the bounded candidate budget, so they cannot crowd out the new Copy sheet.
- Resolve aria-labelledby accessible names and additional explicit Arabic Share labels. Never select controls by their ordinal position or blindly use a neighboring video's Share button.
- Observe and forward the origin-checked main-frame native `copyText` channel as well as inherited web clipboard/execCommand hooks. Do not read clipboard history or install a system clipboard observer.
- Temporarily mask only the newly opened share sheet's opacity during Copy. Restore its exact previous opacity on every exit; never remove site DOM, change body layout/scroll locks, force Back or hide an existing dialog. A completely flash-free transition is not guaranteed.
- Preserve the exact official copied URL (including its legitimate query), validate it and route once. No old address-bar substitute, hardcoded clip URL or direct-media fallback for the owned video download button.
- Missing Share vs missing Copy result now have distinct Arabic failure messages. Stop immediately for an unidentifiable Share button rather than waiting for a manual gesture. Any fresh trusted pointer/key interaction cancels automation.
- Bounded eight-second / 80-scan transaction; idle has no new observer, interval or frame loop. No promise of universal Facebook layout support, zero latency, downloadability or privacy bypass.

Local gate: `FACEBOOST_SOURCE=SOURCE JSDOM_PATH=/absolute/node_modules/jsdom node --test integrations/faceboost-2.18.13/*.test.cjs`.

CI requires 20 Android 13 instrumentation cases. Added native cases cover background aria-hidden and the actual origin-checked WebMessage copy bridge. Controlled Share/Copy handlers are not a logged-in account test, and native intent/clipboard checks do not exercise an installed Seal UI. Record actual results only after the workflow passes.

Preserve accepted seek/ball geometry, upper fullscreen, Like repair, saved home guard, app identity/signing and themes. Compose reference: https://developer.android.com/develop/ui/compose/documentation?hl=ar
