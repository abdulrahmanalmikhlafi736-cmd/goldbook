# FPRO 2.18.33 — thinner painted progress only

Owner explicitly clarified thickness, NOT length. The original painted fill is3 CSS px. Paint the existing gradient centered at1.5 CSS px, without shrinking its existing3px layout box. This preserves the exact ball center, accepted bottom4px offset,14px emoji/18px box,32px hit area and track length. Only three background longhands change: size, position and repeat. No gesture, downloader, image, Story, playback or timer change.

Version2.18.33/code2180033/original identity/signing.256 local tests PASS. Exact50 Android13 gate retains49 and adds a native painted-line/real inherited CSS/ball-center/touch-box test; result pending. The native case loads the original fill and ball CSS rules directly from the actual generated facebook.js rather than inventing fixture geometry.

Apply once to fresh fe8a474b25414b38819b7cf927720899c8c89705. Compose reference: https://developer.android.com/develop/ui/compose/documentation?hl=ar
