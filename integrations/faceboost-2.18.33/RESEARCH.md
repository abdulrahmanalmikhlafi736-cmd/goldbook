# Thickness clarification

User corrected the proposed horizontal shortening: wants the line thinner. Existing base CSS .fpro-fill has height3px, while its touch track is32px and its centered18px ball has top-7.5px. Changing the fill height would move the ball center or require changing its accepted geometry. A centered, non-repeating gradient painted at1.5px inside the unchanged3px fill box halves visual thickness while preserving all geometry. No physical-centimeter conversion is claimed; CSS pixels are density-independent visual units, not calibrated screen centimeters.

No new library or external code. No animation/observer/polling/network/gesture changes. Images, Story download and profile/page Share matching remain unchanged.
