# FPRO 2.18.30 — exact local source retention and stage-specific failure reporting

Owner29 screenshot: local-image read abort, no saved file. This confirms the request reached local handling but the previous generic message did not distinguish fetch/revocation/CSP, payload/type/size, transfer or native data failure. Do not claim screenshot proves any one of these.

## Narrow repair

- Document-start, top-Facebook-frame-only wrapper delegates original URL.createObjectURL and remembers only image/empty-type Blobs (never video/MediaSource). At most2 entries,8MB total,5-second TTL; exact URL lookup and single consumption only. Original revokeObjectURL remains unchanged and immediate. This retains an object reference briefly, not the public URL or a guessed DOM image, so the exact download source can be read even after revocation or when fetch is unavailable. No polling/DOM observer/network hook; references/timers clear on expiry/navigation/consume.
- On-demand reader first takes that exact reference, otherwise keeps29's live-blob fetch fallback. Same MIME, size, origin, frame, token, page, sequence, byte validation and native storage gates remain.
- Percent-encoded data base64 is decoded with Uri.decode, preserving literal plus signs (not form URLDecoder). No MIME acceptance broadening.
- MediaStore publication must update a row successfully before success feedback.
- Failures now show only fixed data/blob mode, stage enum and retained-source hit/miss/unknown. No error strings, raw URLs, image IDs, headers or image contents. This is essential if the owner's particular case is another cause.

Version2.18.30/code2180030/com.almekhlafi; original signing. Apply once to fresh fe8a474b25414b38819b7cf927720899c8c89705.

243 local tests PASS. New cache/reader tests cover exact revoked source, single consume, eviction/byte/count/expiry/navigation bounds, video/oversize exclusion, blocked fetch and safe failure stages. An unchanged29 reader fails the retained-source/blocked-fetch regression. Native exact45-case gate retains43 (live fetch fallback explicitly retained) and adds actual revoked-blob/no-fetch PNG file roundtrip/publication and percent-encoded JPEG exact-byte roundtrip. Native result pending; owner cause/success remain pending.

All video/Seal, hold cleanup, accepted progress/ball, clipboard, Share concealment and developer footer code are unchanged. Compose reference: https://developer.android.com/develop/ui/compose/documentation?hl=ar
