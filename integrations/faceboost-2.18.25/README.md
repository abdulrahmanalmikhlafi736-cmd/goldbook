# FPRO 2.18.25 — small progress-line adjustment and developer contact footer

Owner confirms 2.18.24 download and Share/Copy concealment all work. Preserve that implementation byte-for-byte.

## Changes

- Lower the painted progress line by2 CSS pixels (fill bottom8→6), leaving the32px seek hit area, dock, fullscreen/Like/home gestures, emoji size/shape, download button and timing unchanged. Deliberately small: the footer is already near the bottom viewport edge. The16px visible emoji remains above the edge; no emoji resizing.
- Append a permanent two-line footer after the final settings category, not hidden in a collapsed section:
  - تم التطوير بواسطة عبدالرحمن المخلافي 🧑🏻‍💻
  - لمراسلة المطور اضغط هنا 🙋🏻
- Contact opens an external WhatsApp chat to967781764759, preferring regular WhatsApp then Business. If neither is available, open https://wa.me/967781764759 externally; if no handler works, show the number without crashing. No contacts/storage permission or embedded WebView/navigation.
- Theme-aware Material3 Text/TextButton and existing scrollable settings layout, no extra settings screen or large panel.

Version2.18.25/code2180025/package com.almekhlafi; original signing configuration. Apply once to fresh original fe8a474b25414b38819b7cf927720899c8c89705.

219 local tests PASS. CI requires exact36 Android13 tests: retain34, add actual Compose footer scroll/click + captured exact WhatsApp Intent, and unavailable-app fallback order/number contract. Existing native footer test also checks the actual6px painted offset. Native result pending. WhatsApp delivery to a real account is not claimed from captured Intents.

Official download JS, native clipboard/download bridges, CTA, source extraction, themes and all unrelated behavior are unchanged. Owner visual/WhatsApp acceptance pending.

Compose reference: https://developer.android.com/develop/ui/compose/documentation?hl=ar
