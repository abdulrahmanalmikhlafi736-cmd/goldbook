// Extracted from download_content.js; original author @YeiversonYurgaky.
const SELECTORS={    storyIndicators: [
      'div[data-sigil="story-viewer"]',
      'div[data-sigil="story-popup-header"]',
      'div[data-sigil="story-tray-item"]',
      ".story_body_container",
      ".story_viewer",
      ".story-container",
      'div[aria-label*="highlight"]',
      'div[aria-label*="Highlight"]',
      'div.x1ey2m1c.x9f619.xds687c.x17qophe.x10l6tqk.x13vifvy[role="presentation"]',
      'div[data-pagelet="ProfilePhoto"]'
    ]};
  const isInStoryOrReelView = () => {
    // URL pattern checks
    const url = window.location.href;
    if (
      url.includes("/stories/") ||
      url.includes("/reel/") ||
      url.includes("/videos/") ||
      url.includes("/watch/?") ||
      url.includes("/photo") ||
      url.includes("/photos/") ||
      url.includes("/highlights/")
    ) {
      return true;
    }

    // Element selectors check
    for (const selector of SELECTORS.storyIndicators) {
      if (document.querySelector(selector)) {
        return true;
      }
    }

    return false;
  };

  const hideOpenAppButtons = (root = document) => {
        // Find all div[role="button"] elements
        const buttons = root.querySelectorAll('div[role="button"]');

        buttons.forEach(button => {
          // Check if it contains div.fl.ac with a span containing the 󱥬 symbol
          const flAcDiv = button.querySelector('div.fl.ac');

          if (flAcDiv) {
            const span = flAcDiv.querySelector('span');
            if (span && span.textContent.includes('󱥬')) {
              button.style.display = 'none';
            }
          }
        });
  };


function apply(){if(isInStoryOrReelView()&&!isFeed())hideOpenAppButtons();}
apply();new MutationObserver(apply).observe(document.body,{childList:true,subtree:true});
