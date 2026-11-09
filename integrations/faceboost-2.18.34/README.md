# FPRO 2.18.34 — requested 2px progress paint

Owner requests2px instead of33's1.5px. Change only the painted gradient height to2 CSS px. Keep original3px fill layout box, centered background,4px bottom,14px emoji/18px ball box,32px touch area and track length/position. Existing computed-style/native geometry tests now assert the explicitly requested2px value, with all other assertions retained.

No comment-sort automation implemented. The owner also asked whether the official All comments option can be preferred. Review found no existing force-All-comments setting in the overlay/pinned source. A future optional official-UI selection could prefer that option when offered, but cannot reveal deleted/server-withheld comments or promise a global account/client default. Implementation requires separate agreement and actual FPRO WebView UI verification, not blind reaction/menu clicks.

Version2.18.34/code2180034/original identity/signing.256 local tests PASS; exact50 Android13 gate pending. Apply once to fresh fe8a474b25414b38819b7cf927720899c8c89705.

Compose reference: https://developer.android.com/develop/ui/compose/documentation?hl=ar
