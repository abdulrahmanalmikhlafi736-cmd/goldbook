# FPRO 2.18.46

Owner confirms 2.18.45 regular-video downloads work. Preserve official Share/Copy there.

The small arrow is the inherited facebook.js syncStoryImages overlay, not evidence of the old Goldbook MainActivity running. Removed its entire source/scan/layout/cleanup block. No replacement overlay for image posts. Existing site image Save remains unchanged.

Stories: the existing main video button alone invokes exact-current visible-story MP4 validation and Android DownloadManager. No Seal, Share/Copy, cookies, React extraction, first-video selection or background download work. Native repeats HTTPS/CDN/story route validation. Signed HTTPS MP4 only; blob/DASH or ambiguous players fail closed with a clear message. This is not a guarantee that every Facebook story supplies a direct MP4. Photo stories currently have no new overlay button; image Save remains available from the site.

Local official-download regression gate: 81 passed. Generated facebook.js syntax checked. Old historical fixture suites are not a release gate for these removed features. Account/device verification still required.
