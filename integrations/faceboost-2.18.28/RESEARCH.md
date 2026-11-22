# 2.18.28 owner evidence

The new owner screenshot contains27's exact rejection toast. Therefore the callback fires, but plan is null. Existing code rejects in this order: invalid page HTTPS URL, non-Facebook page, invalid target HTTPS URL, target outside Facebook/fbcdn, unsupported MIME. The screenshot alone cannot identify the gate. A fixed-category diagnostic is added before changing validation or guessing a link/content type. Content-Disposition filename suffix is diagnostic only, not evidence sufficient to accept a file.

No new third-party code, network requests or extraction strategy. Actual owner failure remains unresolved until diagnostic evidence identifies the condition.
