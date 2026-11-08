# FPRO 2.18.24 — visual-only automatic Share/Copy concealment

Owner confirmed 2.18.23 downloads now work. Preserve that exact official Share → unique fresh Copy → internal capture → Seal/copy=0 path. This is not a new link resolver or download mechanism.

## Scoped change

Before the official Share click, snapshot existing menu roots/status text and start an event-driven rendering veil. Newly inserted presentation/dialog/menu/dialog-screen roots that do not contain the selected video get `filter: opacity(0) !important`; their physical pointer hit testing is disabled so an invisible menu action cannot be accidentally tapped. Programmatic official `.click()` still works, and geometry, CSS opacity, accessibility visibility, source ownership and Copy ambiguity gates are not changed. Mutation callbacks run before rendering, not at a polling interval.

During the transaction and a maximum two-second success tail, conceal only changed/new semantic toast/status/alert/live-region elements whose whole normalized text is a known Copy-success phrase. Status text inspection is bounded to32 nodes/160 characters, rejecting aggregate live regions rather than reading a whole feed. Do not hide post text, existing Copy statuses, errors, arbitrary notifications or preexisting video-viewer dialogs. Native automated-copy write/toast suppression remains unchanged; native manual copying keeps its normal toast.

All original inline filter/pointer-events values and priorities are restored at cleanup unless the website replaced them meanwhile. Failure/cancellation restores immediately. Trusted user input, navigation, source/identity change or backgrounding also close the veil; background timers cannot keep it alive behind Seal. On success, a one-shot two-second tail catches asynchronous website Copy feedback, then disconnects the observer and all listeners. No idle polling, screenshot capture, new native bridge or clipboard access.

Known boundary: this targets existing semantic menu containers and semantic toast/status containers. Unknown Facebook markup or native OS UI is not claimed to be universally concealed. Owner-account visual acceptance remains required. Fixture results are not owner-device proof.

## Preservation / verification

Version2.18.24/code2180024/package com.almekhlafi; original signing configuration. Apply once to fresh original fe8a474b25414b38819b7cf927720899c8c89705. 2.18.23 remains untouched.

217 local DOM/gesture tests PASS (204 retained, 13 added). Existing cleanup expectations now explicitly account for and expire the bounded visual-only success tail; clipboard equality, zero native callbacks, manual copying, true ambiguity and exact link assertions remain intact. CI requires exactly34 Android13 tests, adding a real Chromium full home flow checking veiled menu, fresh link/copy0, late Copy status, visible error, expiry and visible manual feedback. All three CI jobs of run42502983907 passed, including the exact34-test Android13 gate at f9b2ba2b50a93ec5c3c4334c5aa5d757b88b9f7f. Owner-account visual acceptance remains pending.

No changes to native clipboard/download bridges, CTA, fullscreen, Like, seek, themes, home prevention, source extraction or package/signing.

Compose reference: https://developer.android.com/develop/ui/compose/documentation?hl=ar
