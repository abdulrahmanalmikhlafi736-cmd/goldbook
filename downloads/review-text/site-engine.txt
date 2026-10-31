// GPL-3.0. Lifecycle integration for the pinned upstream implementations.
// Generated with tools/build-site-engine.cjs. See docs/REPLACEMENT-58.md.
(() => {
 'use strict';
 if(window.FproSiteEngine)return;
 const NativeMO=window.MutationObserver;
 const factories={"adblock":function(window,document,MutationObserver,IntersectionObserver,setTimeout,isDesktopMode,isFeed,scope){let size,svg;
(function() {

    if (isDesktopMode()) {
        (function() {
          const selector = 'div.sponsored_ad, article[data-ft*="sponsored_ad"]';

          const removeSponsored = (root = document) => {
            root.querySelectorAll(selector).forEach(el => scope.remove(el));
          };

          removeSponsored();

          const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
              for (const node of mutation.addedNodes) {
                if (!(node instanceof HTMLElement)) continue;
                if (node.matches(selector)) {
                  scope.remove(node);
                } else {
                  removeSponsored(node);
                }
              }
            }
          });
          observer.observe(document.body, {
            childList: true,
            subtree: true
          });
        })();

        return;
    }

    //  The Ad tag and separator + special icon elements have a unique color of #8a8d91 in both theme modes (we'll see if they fix this with time)

    const processedAds = new WeakSet();

    function removeFeedAds() {
        const spans = document.querySelectorAll('span.f5[style*="color:#8a8d91"]:not([data-nosnippet])');

        spans?.forEach(span => {
            if (processedAds.has(span)) return;
            processedAds.add(span);
        })

        for (const span of spans) {
            const parent = span.parentElement;

            if (!parent?.matches('div.native-text.rslh')) {
                continue;
            }

            const container = parent.closest('div[data-dcm-id="1"][data-mcomponent="MContainer"]');
            if (!container) continue;
            scope.hide(container);

            const postSeparator = container.previousElementSibling;

            if (postSeparator && postSeparator.offsetHeight === 1 && postSeparator.querySelector('[data-fd-action]') ) {
              scope.hide(postSeparator);
            }
        }
    }

    const adsObserver = new MutationObserver(() => {
        removeFeedAds();
    }).observe(document.body, {
        childList: true,
        subtree: true
    });

    removeFeedAds();

    const sponsoredTexts = [
        "Sponsored", "Ad", "Gesponsert", "Sponsorlu", "Sponsorowane",
        "Ispoonsara godhameera", "Geborg", "Bersponsor", "Ditaja",
        "Disponsori", "Giisponsoran", "Sponzorováno", "Sponsoreret",
        "Publicidad", "May Sponsor", "Sponsorisée", "Sponsorisé", "Oipytyvôva",
        "Ɗaukar Nayin", "Sponzorirano", "Uterwa inkunga", "Sponsorizzato",
        "Imedhaminiwa", "Hirdetés", "Misy Mpiantoka", "Gesponsord",
        "Sponset", "Patrocinado", "Sponsorizat", "Sponzorované",
        "Sponsoroitu", "Sponsrat", "Được tài trợ", "Χορηγούμενη",
        "Спонсорирано", "Спонзорирано", "Ивээн тэтгэсэн", "Реклама",
        "Спонзорисано", "במימון", "سپانسرڈ", "دارای پشتیبانی مالی",
        "ስፖንሰር የተደረገ", "प्रायोजित", "ተደረገ", "प", "স্পনসর্ড",
        "ਪ੍ਰਯੋਜਿਤ", "પ્રાયોજિત", "ପ୍ରାୟୋଜିତ", "செய்யப்பட்ட செய்யப்பட்ட",
        "చేయబడినది చేయబడినది", "ಪ್ರಾಯೋಜಿಸಲಾಗಿದೆ", "ചെയ്‌തത് ചെയ്‌തത്",
        "ලද ලද ලද", "สนับสนุน สนับสนุน รับ สนับสนุน สนับสนุน",
        "ကြော်ငြာ ကြော်ငြာ", "ឧបត្ថម្ភ ឧបត្ថម្ភ ឧបត្ថម្ភ", "광고",
        "贊助", "赞助内容", "広告", "സ്‌പോൺസർ ചെയ്‌തത്",
        "Anzeige","Peye","Oglas"
    ];

    function containsSponsoredText(text) {
        const lowerText = text.toLowerCase();
        return sponsoredTexts.some(word => {
            const lowerWord = word.toLowerCase();
            // Use word boundary regex to match whole words only
            const wordBoundaryRegex = new RegExp(`\\b${lowerWord.replace(/[.*+?^${}()|[\]\\]/g, '\\/*__FACTORIES__*/')}\\b`, 'i');
            return wordBoundaryRegex.test(lowerText);
        });
    }


    function removeReelAds(root = document) {
        const containers = root.querySelectorAll('div.vertically-snappable');

        let hiddenCount = 0;
        containers.forEach((container, index) => {
            // Skip if already hidden
            if (container.dataset.adHidden === 'true') {
                return;
            }

            const spans = container.querySelectorAll('span');

            for (const span of spans) {
                const text = span.textContent;

                if (containsSponsoredText(text)) {

                    // Mark as hidden to prevent re-processing
                    container.dataset.adHidden = 'true';

                    // Completely empty the container but keep it in DOM for scroll snap
                    if(scope.protectedUI(container)) return;
                    container.innerHTML = '';

                    // Add a styled message for blocked ad
                    const messageDiv = document.createElement('div');
                    messageDiv.style.cssText = `
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 100%;
                        width: 100%;
                        background: linear-gradient(135deg, #1a1a1a 0%, #000000 100%);
                        color: #666;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                        text-align: center;
                        padding: 20px;
                        box-sizing: border-box;
                    `;

                    const icon = document.createElement('div');
                    icon.style.cssText = `
                        font-size: 48px;
                        margin-bottom: 16px;
                        opacity: 0.6;
                    `;
                    icon.textContent = '🚫';

                    const title = document.createElement('div');
                    title.style.cssText = `
                        font-size: 18px;
                        font-weight: 600;
                        margin-bottom: 8px;
                        color: #888;
                    `;
                    title.textContent = 'إعلان محجوب';

                    const subtitle = document.createElement('div');
                    subtitle.style.cssText = `
                        font-size: 14px;
                        color: #555;
                        line-height: 1.4;
                    `;
                    subtitle.textContent = 'أُزيل المحتوى المموّل';

                    messageDiv.appendChild(icon);
                    messageDiv.appendChild(title);
                    messageDiv.appendChild(subtitle);
                    container.appendChild(messageDiv);

                    // Make container non-interactive
                    container.style.pointerEvents = 'none';
                    container.style.userSelect = 'none';

                    // Set up intersection observer to auto-scroll when this ad comes into view
                    setupAutoScroll(container);

                    hiddenCount++;
                    break;
                }
            }
        });
    }

    // Auto-scroll past hidden ads when they come into view
    function setupAutoScroll(container) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                    // Find next non-hidden reel (skip all consecutive hidden ads)
                    let nextReel = container.nextElementSibling;
                    let skippedCount = 0;

                    while (nextReel && nextReel.dataset.adHidden === 'true') {
                        nextReel = nextReel.nextElementSibling;
                        skippedCount++;
                    }

                    if (nextReel) {
                        // Use a more aggressive scroll approach
                        setTimeout(() => {
                            // Scroll with center alignment for better distance
                            nextReel.scrollIntoView({
                                behavior: 'smooth',
                                block: 'center',
                                inline: 'nearest'
                            });

                            // Additional scroll push after a short delay to ensure we're past the ad
                            setTimeout(() => {
                                window.scrollBy({
                                    top: 100,
                                    behavior: 'smooth'
                                });
                            }, 200);
                        }, 100);
                    }

                    // Unobserve after scrolling once
                    observer.unobserve(container);
                }
            });
        }, {
            threshold: 0.5 // Trigger when 50% of the ad is visible
        });

        observer.observe(container);
    }

    // Initial cleanup
    removeReelAds();

    // Watch for dynamically added reel ads
    const reelObserver = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (!(node instanceof HTMLElement)) continue;

                // Check if the added node is a vertically-snappable container or contains one
                if (node.matches('div.vertically-snappable')) {
                    removeReelAds(node.parentElement || document);
                } else if (node.querySelector('div.vertically-snappable')) {
                    removeReelAds(node);
                }
            }
        }
    });

    reelObserver.observe(document.body, { childList: true, subtree: true });
})();

},
"amoled_black":function(window,document,MutationObserver,IntersectionObserver,setTimeout,isDesktopMode,isFeed,scope){let size,svg;
(function() {
  const backgroundColorRegex = /background-color\s*:\s*(#242526|rgba\s*\(\s*36\s*,\s*37\s*,\s*38\s*,\s*1\.?0*\s*\)|rgba\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*1\.?0*\s*\)|rgb\s*\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)|#([0-9a-fA-F]{6}))\s*;/gi;
  const backgroundRegex = /background\s*:\s*(rgba\s*\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d*\.?\d+\s*\)|rgb\s*\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)|#([0-9a-fA-F]{6}))\s*;/gi;
  const colorRegex = /color\s*:\s*(rgba\s*\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d*\.?\d+\s*\)|rgb\s*\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)|#([0-9a-fA-F]{6}))\s*;/gi;
  const borderRegex = /border-color\s*:\s*(rgba\s*\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d*\.?\d+\s*\))\s*;/gi;

  function isLightGray(r, g, b) {
    return r >= 50 && r <= 150 && g >= 50 && g <= 150 && b >= 50 && b <= 150 &&
           Math.abs(r - g) <= 20 && Math.abs(g - b) <= 20 && Math.abs(r - b) <= 20;
  }

  const processedStyles = new WeakSet();

  function processStyles() {
    document.querySelectorAll('style').forEach(style => {
      if (processedStyles.has(style)) return;
      processedStyles.add(style);

      if (style.sheet?.cssRules) {
        try {
          Array.from(style.sheet.cssRules).forEach(rule => {
            const bg = rule.style?.backgroundColor.replace(/\s+/g, '').toLowerCase();
            if (bg === '#242526' || bg === 'rgba(36,37,38,1)' || bg === 'rgba(36,37,38,1.0)') {
              scope.cssRule(rule.style,"background-color", '#000000');
            } else if (bg.startsWith('rgba(')) {
              const match = bg.match(/rgba\((\d+),(\d+),(\d+),1\.?0*\)/);
              if (match && isLightGray(...match.slice(1).map(Number))) {
                scope.cssRule(rule.style,"background-color", '#121212');
              }
            } else if (bg.startsWith('#') && bg.length === 7) {
              const [r, g, b] = [1, 3, 5].map(i => parseInt(bg.slice(i, i + 2), 16));
              if (isLightGray(r, g, b)) scope.cssRule(rule.style,"background-color", '#121212');
            }
          });
        } catch (e) {}
      }

      if (style.innerHTML) {
        style.innerHTML = style.innerHTML?.replace(backgroundColorRegex, (m, g, r, g2, b, hex) => {
          if (['#242526', '#242527', 'rgba(16,16,17,1.0)', 'rgba(24,25,26,1.0)', 'rgba(28,28,29,1.0)', 'rgba(36,37,38,1.0)', 'rgba(37,39,40,1.0)', 'rgba(38,38,38,1.0)'].includes(g)) return 'background-color:#000000;';
          if (((r && g2 && b && isLightGray(+r, +g2, +b))) || g === 'rgba(51,51,52,1.0)') return 'background-color:#121212;';
          if (hex && isLightGray(...[0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16)))) {
            return 'background-color:#121212;';
          }
          return m;
        });
        style.innerHTML = style.innerHTML?.replace(borderRegex, (m, g) => {
           if (g === 'rgba(37,39,40,1.0)') return 'border-color:#000000;';
           return m;
        });
      }
    });

    document.querySelectorAll('[style*="background-color"]').forEach(el => {
      const style = el.getAttribute('style')?.replace(backgroundColorRegex, (m, g, r, g2, b, hex) => {
        if (['#18191a', '#242526', 'rgba(36,37,38,1.0)'].includes(g)) return 'background-color:#000000;';
        if (r && g2 && b && isLightGray(+r, +g2, +b) || g === 'rgb(37, 39, 40)') return 'background-color:#121212;';
        if (hex && isLightGray(...[0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16)))) {
          return 'background-color:#121212;';
        }
        return m;
      });
      if (style !== el.getAttribute('style')) el.setAttribute('style', style);
    });

    // Login-specific AB
    document.querySelectorAll('[data-bloks-name="bk.components.TextSpan"][style*="color"], [class*="wbloks"][style*="color"]').forEach(el => {
      const style = el.getAttribute('style')?.replace(colorRegex, (m, g, hex) => {
        if (g === 'rgb(17, 17, 18)') return 'color:#dfdfdf; caret-color:#dfdfdf;';
        if (hex === '111112') return 'color:#dfdfdf;'; // hacky communication between material_you.js and this file
        return m;
      });
      if (style !== el.getAttribute('style')) el.setAttribute('style', style);
    });

    document.querySelectorAll('[class*="wbloks"][style*="background"]').forEach(el => {
      const style1 = el.getAttribute('style')?.replace(backgroundColorRegex, (m, g, r, g2, b, hex) => {
        if (g === 'rgb(255, 255, 255)') return 'background-color:#000000;';
        return m;
      });
      if (style1 !== el.getAttribute('style')) el.setAttribute('style', style1);

      const style2 = el.getAttribute('style')?.replace(backgroundRegex, (m, g, hex) => {
        if (g === 'rgba(255, 255, 255, 0.2)') return 'background:#121212;';
        if (g === 'rgb(242, 244, 246)') return 'background:#181818;';
        return m;
      });
      if (style2 !== el.getAttribute('style')) el.setAttribute('style', style2);
    });

    // Bottom sheet borders
    document.querySelectorAll('[style*="--nbc"]').forEach(el => {
      let val = el.style.getPropertyValue('--nbc')?.trim().toLowerCase();
      if (['#242526', '#252728', '#1c1c1d'].includes(val)) {
        el.style.setProperty('--nbc', '#000000');
        return;
      }
      if (val === '#3b3c3e') {
        el.style.setProperty('--nbc', '#121212');
        return;
      }
    });

    // "Feed" tab spinner background
    document.querySelectorAll('div[data-mcomponent="MSpinner"]')?.forEach(spinner => {
      const parent = spinner.closest('div[data-mcomponent="MContainer"][style*="margin-top:-1px"]');
      if (parent) parent.classList.add('spinner-parent');
    });

    const meta = document.querySelector('meta[name="theme-color"]')
    const content = meta?.getAttribute('content')?.toLowerCase().trim();
    // only theme white theme-color on the login and cookie screens
    if (!(['#242526', '#3b5998'].includes(content) || (content === '#ffffff' && document.querySelector('[class*="wbloks"]')))) return;
    meta?.setAttribute('content', '#000000');
  }

   processStyles();

  function loginAndCookieCSS() {
    const style = document.createElement('style');
    style.textContent = `
      .wbloks_11 {
          --wbloks-cds-overlay-alpha-80: rgba(0, 0, 0, 0.5);
          --wbloks-cds-surface-background: #000;
      }

      .acw, .wbloks_73, ._algy, ._al7d { background-color: #000; }
      .spinner-parent::before { background-color:#000 !important; }

      .wbloks_76, ._algy, ._al5f, ._am37, ._al7j ._al66, ._al5g, ._albn, ._al7d { color: #fff; }
      .wbloks_75 { color: #dfdfdf; }
      div.wbloks_67 { border-top: 1px solid #363636; }

      ._albn, ._al4_, ._al5g, .toast-label { background-color: #121212; }
      ._al7j ._al66, ._9nqb { background-color: #242424; }
      .sp_M-AstDWg75z_3x { filter: invert(1) }

      :root, .__fb-light-mode:root, .__fb-light-mode {
        --card-background: #121212;
        --primary-text: #fff;
        --secondary-text: #dedede;
        --secondary-icon: #dedede;
        --secondary-button-background: #242424;
        --input-background: #242424;
        --overlay-alpha-80: rgba(0, 0, 0, 0.8);
        --web-wash: #000;
        --surface-background: #000;
        --always-white: #000;
        --comment-background: #242424;
        --primary-icon: #dedede;
        --secondary-button-text: #dedede;
        --card-background-flat: #242424;
      }
    `;
    document.head.appendChild(style);
  }

  loginAndCookieCSS();

  new MutationObserver(mutations => {
    if (mutations.some(m =>
      (m.type === 'childList' && Array.from(m.addedNodes).some(n =>
        n.tagName === 'STYLE' || (n.nodeType === 1 && n.hasAttribute('style')) ||
        (n.tagName === 'META' && n.getAttribute('name') === 'theme-color'))) ||
      (m.type === 'characterData' && m.target.parentNode?.tagName === 'STYLE') ||
      (m.type === 'attributes' && (m.attributeName === 'style' ||
        (m.target.tagName === 'META' && m.attributeName === 'content'))))
    ) processStyles();
  }).observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['style', 'content']
  });
})();
},
"bottom_banner":function(window,document,MutationObserver,IntersectionObserver,setTimeout,isDesktopMode,isFeed,scope){let size,svg;
// Hide annoying bottom banners
const hideBottomBanner = () => {

  if (location.pathname === '/'
  && document.querySelector('div[role="button"][aria-label*="Facebook"]') === null) return;

  const element = document.querySelector('.bottom.fixed-container');
  if (
    element &&
    !element.hasAttribute('data-shift-on-keyboard-shown')
  ) {
    const heightAttr = element.getAttribute('data-actual-height');
    if (heightAttr && parseInt(heightAttr, 10) < 80) {
      scope.hide(element);
    }
  }
};
hideBottomBanner();
const observer = new MutationObserver(hideBottomBanner);

observer.observe(document.body, { childList: true, subtree: true });



},
"hide_groups":function(window,document,MutationObserver,IntersectionObserver,setTimeout,isDesktopMode,isFeed,scope){let size,svg;
// Hide group suggestions on search page
(() => {
  const hideLastGroupSuggestion = () => {
    if (window.location.href.includes('facebook.com/search')) {
      const parents = document.querySelectorAll('[data-is-h-scrollable]');
      const lastParent = parents[parents.length - 1]?.closest('.m.bg-s1');
      if (lastParent) scope.hide(lastParent);
    }
  };

  hideLastGroupSuggestion();
  new MutationObserver(hideLastGroupSuggestion).observe(document.body, { childList: true, subtree: true });
})();

// Hide on comments
(() => {
  const hideGroupContainer = () => {
    if (!window.location.href.includes('facebook.com/story.php?') && !window.location.href.includes('facebook.com/groups')) return;

    const groupContainer = document.querySelector('h3[data-tti-phase="-1"].m');
    if (groupContainer) {
      const parent = groupContainer.closest('.m.bg-s2');
      if (parent) scope.hide(parent);
    }
  };

  hideGroupContainer();

  new MutationObserver(hideGroupContainer).observe(document.body, {
    childList: true,
    subtree: true,
  });
})();


},
"hide_pymk":function(window,document,MutationObserver,IntersectionObserver,setTimeout,isDesktopMode,isFeed,scope){let size,svg;
// Hide "People You May Know" suggestions on the Facebook search page
(function() {
  const hidePymk = () => {
    if (!window.location.href.includes('facebook.com/search/')) return;
    
    const imgArea = document.querySelector('[data-mcomponent="ImageArea"]');
    const suggCont = imgArea?.nextElementSibling;

    if (suggCont) scope.hide(suggCont);
  };

  hidePymk();

  const obs = new MutationObserver(() => {
    hidePymk();
  });

  obs.observe(document.body, {
    childList: true,
    subtree: true
  });
})();


// Hide "People You May Know" suggestions in the main feed
(() => {
  const hidePymk = (nodes) => {
    if (window.location.pathname !== '/') return;
    nodes.forEach(node => {
      if (!(node instanceof HTMLElement)) return;
      const targets = node.matches('.hscroller') ? [node] : node.querySelectorAll?.('.hscroller') || [];
      targets.forEach(el => scope.hide(el.closest('[data-tracking-duration-id]')));
    });
  };

  hidePymk([document.body]);

  new MutationObserver(muts =>
    muts.forEach(m => hidePymk([...m.addedNodes]))
  ).observe(document.body, { childList: true, subtree: true });
})();

},
"hide_reels":function(window,document,MutationObserver,IntersectionObserver,setTimeout,isDesktopMode,isFeed,scope){let size,svg;
(() => {
  const isDesktop = window.isDesktopMode && window.isDesktopMode();

  if (isDesktop) {
    const CONTAINER = 'div.x6ikm8r.x10wlt62';
    const CHILD = 'div.x6s0dn4.x78zum5.xnpuxes';

    const handle = node => {
      if (!(node instanceof HTMLElement)) return;
      const targets = node.matches(CONTAINER) ? [node] : node.querySelectorAll(CONTAINER);
      targets.forEach(container => {
        if (container.querySelector(CHILD)) scope.hide(container);
      });
    };

    document.querySelectorAll(CONTAINER).forEach(handle);

    new MutationObserver(muts => {
      muts.forEach(m => m.addedNodes.forEach(handle));
    }).observe(document.body, { childList: true, subtree: true });

  } else {
    const ICONS = ['󲀠', '󰣝'];
    const FLAG = 'data-reel-hidden';

    const handle = node => {
      if (!(node instanceof HTMLElement)) return;
      const items = node.matches('.fl.ac .native-text') ? [node] : node.querySelectorAll('.fl.ac .native-text');
      items.forEach(el => {
        if (ICONS.includes(el.textContent.trim())) {
          const box = el.closest('[data-tracking-duration-id]');
          if (box && !box.hasAttribute(FLAG)) {
            box.setAttribute(FLAG, '1');
            scope.hide(box);
          }
        }
      });
    };

    document.querySelectorAll('.fl.ac .native-text').forEach(handle);

    new MutationObserver(muts => {
      muts.forEach(m => m.addedNodes.forEach(handle));
    }).observe(document.body, { childList: true, subtree: true });
  }
})();

},
"hide_stories":function(window,document,MutationObserver,IntersectionObserver,setTimeout,isDesktopMode,isFeed,scope){let size,svg;
// Hide "story" container from feed.
(function() {
  const hideTargetElement = () => {
    const storyContainer = isDesktopMode() ? document.querySelector('.x193iq5w.xgmub6v.x1ceravr')
        : document.querySelector('[data-mcomponent="MContainer"][data-srat="43"]');

    if (storyContainer) scope.hide(storyContainer);
  };

  hideTargetElement();

  const observer = new MutationObserver(() => {
    hideTargetElement();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();

},
"hide_suggested":function(window,document,MutationObserver,IntersectionObserver,setTimeout,isDesktopMode,isFeed,scope){let size,svg;
// Hide suggested posts from feed
(function() {

    // Hide suggested posts from feed
    if (window.isDesktopMode()) {
      (() => {
        const containerSelector = '.x1yztbdb.x1n2onr6.xh8yej3.x1ja2u2z';
        const targetSpanSelector = 'span.xzsf02u.xo1l8bm.xdwrcjd';

        const hideMatchingContainers = () => {
          const containers = document.querySelectorAll(containerSelector);
          containers.forEach(container => {
            const targetSpan = container.querySelector(targetSpanSelector);
            if (targetSpan) {
              scope.hide(container);
            }
          });
        };

        hideMatchingContainers();

        const observer = new MutationObserver(() => {
          hideMatchingContainers();
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true,
        });
      })();
    } else {
      (function() {
        function processNode(node) {
          if (!(node instanceof HTMLElement)) return;
          if (window.location.pathname !== '/') return;

          const textSpans = node.querySelectorAll(
            'div[data-mcomponent="TextArea"][data-type="text"][data-tti-phase="-1"] .native-text > span'
          );

          textSpans.forEach(textSpan => {
            if (textSpan.textContent.trim() === '•') {
              const suggestedPostContainer = textSpan.closest('div[data-tracking-duration-id]');
              if (suggestedPostContainer) {
                scope.hide(suggestedPostContainer);
                const postGap = suggestedPostContainer.previousElementSibling;
                if (postGap) {
                  scope.hide(postGap);
                }
              }
            }
          });
        }

        const observer = new MutationObserver(mutations => {
          for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
              processNode(node);
            }
          }
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true
        });

        processNode(document.body);
      })();
    }
})();


},
"material_you":function(window,document,MutationObserver,IntersectionObserver,setTimeout,isDesktopMode,isFeed,scope){let size,svg;
(function() {
  const MATERIALYOU_PRIMARY = window.MaterialYouBridge.getMaterialYouPrimaryRgbString();
  const MATERIALYOU_ONPRIMARY = window.MaterialYouBridge.getMaterialYouOnPrimaryRgbString();
  const MATERIALYOU_PRIMARY_RGB = JSON.parse(window.MaterialYouBridge.getMaterialYouPrimaryRgb());
  const MATERIALYOU_ONPRIMARY_RGB  = JSON.parse(window.MaterialYouBridge.getMaterialYouOnPrimaryRgb());

  const backgroundColorRegex = /background-color\s*:\s*(rgba\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d*\.?\d+)\s*\)|rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)|#([0-9a-fA-F]{6}))\s*;/gi;
  const backgroundRegex = /background\s*:\s*(rgba\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d*\.?\d+)\s*\)|rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)|#([0-9a-fA-F]{6}))\s*;/gi;
  const colorRegex = /color\s*:\s*(rgba\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d*\.?\d+)\s*\)|rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)|#([0-9a-fA-F]{6}))\s*;/gi;
  const borderRegex = /border\s*:\s*(\d{1}px)\s+solid\s+(rgba\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d*\.?\d+)\s*\)|rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)|#([0-9a-fA-F]{6}))\s*;/gi;
  const borderColorRegex = /border-color\s*:\s*(rgba\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d*\.?\d+)\s*\)|rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)|#([0-9a-fA-F]{6}))\s*;/gi;

  function isFacebookBlue(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max - min;

    return (
      b > r + 40 &&
      b > g + 20 &&
      saturation > 60 &&
      b > 100
    );
  }

  // Mechanism to prevent some parts of the code infinitely triggering the MO, causing the function to loop
  const processedStyles = new WeakSet();

  function processMaterialYouStyles() {
    document.querySelectorAll('style')?.forEach(style => {
      if (processedStyles.has(style)) return;
      processedStyles.add(style);

      if (style.innerHTML) {
        style.innerHTML = style.innerHTML?.replace(backgroundColorRegex, (m, gr, Ar, Ag, Ab, Aa, r, g, b, hex) => {
          if ((r && g && b && isFacebookBlue(+r, +g, +b)) ||
          (hex && isFacebookBlue(...[0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16))))) return `background-color:${MATERIALYOU_PRIMARY};`;
          if (Ar && Ag && Ab && isFacebookBlue(+Ar, +Ag, +Ab)) return `background-color: rgba(${MATERIALYOU_PRIMARY_RGB.r}, ${MATERIALYOU_PRIMARY_RGB.g}, ${MATERIALYOU_PRIMARY_RGB.b}, ${+Aa});`;
          if (gr === 'rgba(0,152,124,1.0)') return `background-color:${MATERIALYOU_ONPRIMARY};`;
          if (gr === 'rgba(231,243,255,1.0)') return `background-color: rgba(${MATERIALYOU_PRIMARY_RGB.r}, ${MATERIALYOU_PRIMARY_RGB.g}, ${MATERIALYOU_PRIMARY_RGB.b}, 0.098);`;
          if (gr === 'rgba(235,245,255,1.0)') return `background-color: rgba(${MATERIALYOU_PRIMARY_RGB.r}, ${MATERIALYOU_PRIMARY_RGB.g}, ${MATERIALYOU_PRIMARY_RGB.b}, 0.2);`;
          if (gr === 'rgba(37,47,60,1.0)') return `background-color: rgb(${Object.values(MATERIALYOU_PRIMARY_RGB).map(c => Math.round(c * 0.49)).join(', ')});`;
          if (hex === '252f3c') return `background-color: rgba(${MATERIALYOU_PRIMARY_RGB.r}, ${MATERIALYOU_PRIMARY_RGB.g}, ${MATERIALYOU_PRIMARY_RGB.b}, 0.49);`;
          return m;
        });

        style.innerHTML = style.innerHTML?.replace(borderColorRegex, (m, gr, Ar, Ag, Ab, Aa, r, g, b, hex) => {
          if ((r && g && b && isFacebookBlue(+r, +g, +b)) ||
          (hex && isFacebookBlue(...[0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16))))) return `border-color:${MATERIALYOU_PRIMARY};`;
          if (Ar && Ag && Ab && isFacebookBlue(+Ar, +Ag, +Ab)) return `border-color: rgba(${MATERIALYOU_PRIMARY_RGB.r}, ${MATERIALYOU_PRIMARY_RGB.g}, ${MATERIALYOU_PRIMARY_RGB.b}, ${+Aa});`;
          return m;
        });
      }
    });

    document.querySelectorAll('[style*="color"]')?.forEach(el => {
      const style = el.getAttribute('style')?.replace(colorRegex, (m, gr, Ar, Ag, Ab, Aa, r, g, b, hex) => {
        if ((r && g && b && isFacebookBlue(+r, +g, +b)) ||
        (hex && isFacebookBlue(...[0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16)))) || hex === 'e8eaee') return `color:${MATERIALYOU_PRIMARY};`;
        if (Ar && Ag && Ab && isFacebookBlue(+Ar, +Ag, +Ab)) return `color: rgba(${MATERIALYOU_PRIMARY_RGB.r}, ${MATERIALYOU_PRIMARY_RGB.g}, ${MATERIALYOU_PRIMARY_RGB.b}, ${+Aa});`;
        if (gr === 'rgb(17, 17, 18)') return `color:#111112; caret-color:${MATERIALYOU_PRIMARY};`; // hacky communication between amoled_black.js and this file
        return m;
      });
      if (style !== el.getAttribute('style')) el.setAttribute('style', style);
    });

    document.querySelectorAll('[style*="background-color"]')?.forEach(el => {
      const style = el.getAttribute('style')?.replace(backgroundColorRegex, (m, gr, Ar, Ag, Ab, Aa, r, g, b, hex) => {
        if ((r && g && b && isFacebookBlue(+r, +g, +b)) ||
        (hex && isFacebookBlue(...[0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16))))) return `background-color:${MATERIALYOU_PRIMARY};`;
        if (Ar && Ag && Ab && isFacebookBlue(+Ar, +Ag, +Ab)) return `background-color: rgba(${MATERIALYOU_PRIMARY_RGB.r}, ${MATERIALYOU_PRIMARY_RGB.g}, ${MATERIALYOU_PRIMARY_RGB.b}, ${+Aa});`;
        if (gr === 'rgb(102, 106, 114)') return `background-color: ${MATERIALYOU_PRIMARY};`;
        if (hex === '252f3c') return `background-color: transparent;`;
        return m;
      });
      if (style !== el.getAttribute('style')) el.setAttribute('style', style);
    });

    document.querySelectorAll('[style*="background"]')?.forEach(el => {
      const style = el.getAttribute('style')?.replace(backgroundRegex, (m, gr, Ar, Ag, Ab, Aa, r, g, b, hex) => {
        if ((r && g && b && isFacebookBlue(+r, +g, +b)) ||
        (hex && isFacebookBlue(...[0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16))))) return `background:${MATERIALYOU_PRIMARY};`;
        if (Ar && Ag && Ab && isFacebookBlue(+Ar, +Ag, +Ab)) return `background: rgba(${MATERIALYOU_PRIMARY_RGB.r}, ${MATERIALYOU_PRIMARY_RGB.g}, ${MATERIALYOU_PRIMARY_RGB.b}, ${+Aa});`;
        return m;
      });
      if (style !== el.getAttribute('style')) el.setAttribute('style', style);
    });

    document.querySelectorAll('[style*="border:"]')?.forEach(el => {
      const style = el.getAttribute('style')?.replace(borderRegex, (m, px, gr, Ar, Ag, Ab, Aa, r, g, b, hex) => {
        if ((r && g && b && isFacebookBlue(+r, +g, +b)) ||
        (hex && isFacebookBlue(...[0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16))))) return `border: ${px} solid ${MATERIALYOU_PRIMARY};`;
        if (Ar && Ag && Ab && isFacebookBlue(+Ar, +Ag, +Ab)) return `border: ${px} solid rgba(${MATERIALYOU_PRIMARY_RGB.r}, ${MATERIALYOU_PRIMARY_RGB.g}, ${MATERIALYOU_PRIMARY_RGB.b}, ${+Aa});`;
        if (gr === 'rgb(102, 106, 114)') return `border: ${px} solid ${MATERIALYOU_PRIMARY};`;
        return m;
      });
      if (style !== el.getAttribute('style')) el.setAttribute('style', style);
    });

    document.querySelectorAll('[style*="--nbc"]')?.forEach(el => {
      if (isFacebookBlue(...[1, 3, 5].map(i => parseInt(el.style.getPropertyValue('--nbc').slice(i, i + 2), 16)))) el.style.setProperty('--nbc', MATERIALYOU_PRIMARY);
    });

    // Recolor story ring on the profile page + feed FB logo in light mode
    document.querySelectorAll('img[src*="vTzapVsBgS_.webp"], img[src*="NtDLSQuICbO.webp"]')?.forEach(img => {
      if (processedStyles.has(img)) return;
      processedStyles.add(img);
      img.style.cssText += `
        background-color: ${MATERIALYOU_PRIMARY};
        mask: url(${img.src}) no-repeat center / contain;
        content-visibility: hidden;
      `;
    });

    // Swap FB logo on the login screen
    document.querySelectorAll('img[src*="DUiOg0mJTjz.webp"]')?.forEach(img => {
      size = img.style.maxHeight;
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" width="${parseInt(size) * 1.5}px" height="${parseInt(size) * 1.5}px">
                    <circle cx="54" cy="54" r="54" fill="${MATERIALYOU_PRIMARY}" />
                    <path d="M38.3351 43.8375V72.288H27.9532V36.284H37.7029L38.3351 43.8375ZM37.0041 53.0215L34.3753 53.0881C34.3753 50.5592 34.6748 48.241 35.2738 46.1335C35.8949 44.0039 36.7934 42.1516 37.9691 40.5766C39.1448 39.0015 40.5978 37.7814 42.3282 36.9163C44.0807 36.0511 46.0994 35.6185 48.3843 35.6185C49.9815 35.6185 51.4345 35.8625 52.7434 36.3506C54.0522 36.8164 55.1725 37.5596 56.1042 38.58C57.0581 39.5783 57.7901 40.8871 58.3004 42.5065C58.8106 44.1037 59.0657 46.0226 59.0657 48.2632V72.288H48.6838V49.5276C48.6838 47.9304 48.4841 46.7214 48.0848 45.9006C47.7077 45.0576 47.1531 44.4809 46.421 44.1703C45.689 43.8597 44.8127 43.7044 43.7923 43.7044C42.6831 43.7044 41.6959 43.9485 40.8308 44.4365C39.9878 44.9024 39.2779 45.5568 38.7011 46.3997C38.1244 47.2427 37.6918 48.2299 37.4034 49.3613C37.1372 50.4926 37.0041 51.7127 37.0041 53.0215ZM58.0009 52.4891L54.7066 52.7553C54.7066 50.3151 54.995 48.0524 55.5718 45.9672C56.1485 43.8819 57.0137 42.0739 58.1673 40.5433C59.3208 38.9904 60.7516 37.7814 62.4598 36.9163C64.1901 36.0511 66.1977 35.6185 68.4826 35.6185C70.1686 35.6185 71.6992 35.8625 73.0746 36.3506C74.4722 36.8386 75.6701 37.6261 76.6684 38.7131C77.6888 39.8001 78.4763 41.231 79.0309 43.0057C79.5855 44.7582 79.8628 46.91 79.8628 49.4611V72.288H69.4143V49.4611C69.4143 47.886 69.2147 46.6881 68.8154 45.8673C68.4383 45.0465 67.8837 44.4809 67.1516 44.1703C66.4417 43.8597 65.5877 43.7044 64.5894 43.7044C63.4802 43.7044 62.5152 43.9374 61.6944 44.4032C60.8737 44.8469 60.186 45.468 59.6314 46.2666C59.0768 47.0431 58.6664 47.9637 58.4002 49.0285C58.134 50.0933 58.0009 51.2469 58.0009 52.4891Z"
                          fill="${MATERIALYOU_ONPRIMARY}" />
                   </svg>`;
      img.outerHTML = svg;
    });
  }

  processMaterialYouStyles();

  function materialYouCSS() {
    const style = document.createElement('style');
    style.textContent = `
      ::selection {
        background: rgba(${MATERIALYOU_PRIMARY_RGB.r}, ${MATERIALYOU_PRIMARY_RGB.g}, ${MATERIALYOU_PRIMARY_RGB.b}, 0.5);
        color: ${MATERIALYOU_ONPRIMARY};
      }

      .wbloks_11 { --wbloks-fig-blue-tint-10: ${MATERIALYOU_ONPRIMARY} !important; }
      .wbloks_70, ._al7j a, ._aqwl { color: ${MATERIALYOU_PRIMARY}; }
      ._al7j ._al65, ._9nqa:checked + ._9nqb, .pull-to-refresh-spinner, .loading-bar-animation { background-color: ${MATERIALYOU_PRIMARY}; }
      .revamped-progress-bar-color .loading-bar-animation { background: ${MATERIALYOU_PRIMARY}; }
      .pull-to-refresh-spinner-icon { color: ${MATERIALYOU_ONPRIMARY}; }

      :root, .__fb-light-mode:root, .__fb-light-mode {
        --primary-button-background: ${MATERIALYOU_PRIMARY};
        --blue-link: ${MATERIALYOU_PRIMARY};
        --focus-ring-blue: ${MATERIALYOU_PRIMARY};
        --accent: ${MATERIALYOU_PRIMARY};
        --primary-deemphasized-button-text: ${MATERIALYOU_PRIMARY};
        --highlight-bg: rgba(${MATERIALYOU_PRIMARY_RGB.r}, ${MATERIALYOU_PRIMARY_RGB.g}, ${MATERIALYOU_PRIMARY_RGB.b}, 0.2);
        --primary-deemphasized-button-background: rgba(${MATERIALYOU_PRIMARY_RGB.r}, ${MATERIALYOU_PRIMARY_RGB.g}, ${MATERIALYOU_PRIMARY_RGB.b}, 0.2);
        --primary-deemphasized-button-pressed-overlay: rgba(${MATERIALYOU_PRIMARY_RGB.r}, ${MATERIALYOU_PRIMARY_RGB.g}, ${MATERIALYOU_PRIMARY_RGB.b}, 0.15);
      }
    `;
    document.head.appendChild(style);
  }

  materialYouCSS();

  new MutationObserver(() => {
    processMaterialYouStyles();
  }).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style']
  });
})();
},
"open_app_glyph":function(window,document,MutationObserver,IntersectionObserver,setTimeout,isDesktopMode,isFeed,scope){let size,svg;
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
              scope.hide(button);
            }
          }
        });
  };


function apply(){if(isInStoryOrReelView()&&!isFeed())hideOpenAppButtons();}
apply();new MutationObserver(apply).observe(document.body,{childList:true,subtree:true});

},
"sticky_navbar":function(window,document,MutationObserver,IntersectionObserver,setTimeout,isDesktopMode,isFeed,scope){let size,svg;
(function() {

    if (window.isDesktopMode()) {
        (() => {
          const waitForBanner = () => new Promise(resolve => {
            const existing = document.querySelector('div[role="banner"]');
            if (existing) return resolve(existing);

            new MutationObserver((mutations, obs) => {
              for (const { addedNodes } of mutations) {
                for (const node of addedNodes) {
                  if (node.nodeType === 1 && node.matches('div[role="banner"]')) {
                    obs.disconnect();
                    return resolve(node);
                  }
                }
              }
            }).observe(document.body, { childList: true, subtree: true });
          });

          const forceFixed = el => {
            if (el?.classList.contains('xixxii4')) {
              el.style.setProperty('position', 'fixed', 'important');
            }
          };

          waitForBanner().then(scope.wrap(banner => {
            const style = document.createElement('style');
            style.textContent = `
              div[role="banner"].xixxii4,
              div[role="banner"] .xixxii4 {
                position: fixed !important;
              }
            `;
            document.head.appendChild(style);

            forceFixed(banner);
            banner.querySelectorAll('.xixxii4').forEach(forceFixed);

            new MutationObserver(mutations => {
              for (const m of mutations) {
                if (m.type === 'childList') {
                  m.addedNodes.forEach(n => {
                    forceFixed(n);
                    n.querySelectorAll?.('.xixxii4')?.forEach(forceFixed);
                  });
                } else if (m.type === 'attributes' && m.attributeName === 'class') {
                  forceFixed(m.target);
                }
              }
            }).observe(banner, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
          }));
        })();
        return;
    }

    const applyStyles = () => {
        const navbar = document.querySelector('div[data-tti-phase="-1"][data-mcomponent="MContainer"][data-type="container"][data-focusable="true"].m');
        const tabbar = document.querySelector('div[role="tablist"][data-tti-phase="-1"][data-type="container"][data-mcomponent="MContainer"].m');
        const scroller = document.querySelector('div[data-type="vscroller"][data-is-pull-to-refresh-allowed="true"]');

        const hasLogo = navbar?.querySelector('div[aria-label*="Facebook"]');
        const hasFeed = tabbar?.querySelector('div[aria-label*="feed"]');

        const navbarHeight = navbar ? parseFloat(getComputedStyle(navbar).height) || parseFloat(navbar.style.height) || 0 : 0;
        const tabbarHeight = tabbar ? parseFloat(getComputedStyle(tabbar).height) || parseFloat(tabbar.style.height) || 0 : 0;

        if (hasLogo) Object.assign(navbar.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            zIndex: '1000',
            pointerEvents: 'auto'
        });

        if (hasFeed) Object.assign(tabbar.style, {
            position: 'fixed',
            top: hasLogo ? navbarHeight + 'px' : '',
            left: '0',
            width: '100%',
            zIndex: '999',
            pointerEvents: 'auto'
        });

        if (scroller) {
            const offset = (hasLogo ? navbarHeight : 0) + (hasFeed ? tabbarHeight : 0);
            const scrollContent = scroller.querySelector(':scope > div:not(.pull-to-refresh-spinner-container)');
            scrollContent ? scrollContent.style.marginTop = offset + 'px' : scroller.style.paddingTop = offset + 'px';

            if (window.isFeed()) scroller.style.paddingBottom = '0';

            const spinnerContainer = scroller.querySelector('.pull-to-refresh-spinner-container');
            if (spinnerContainer) Object.assign(spinnerContainer.style, {
                zIndex: '1001',
            });

            const spinner = scroller.querySelector('.pull-to-refresh-spinner');
            if (spinner) spinner.style.margin = '0 auto';
        }

        Object.assign(document.body.style, {
            paddingTop: '0',
            marginTop: '0',
            overflow: 'visible',
            height: '100%'
        });
    };

    applyStyles();
    new MutationObserver(applyStyles).observe(document.body, { childList: true, subtree: true });
})();
}};
 const colors={'ذهبي':'#d4af37','أحمر':'#c62828','أخضر':'#17833e','بنفسجي':'#8643c5','برتقالي':'#ed701b','فيروزي':'#008c95','وردي':'#d34489','بني':'#805539','فضي':'#9ba6b0','أبيض':'#ffffff'};
 let active=null,signature='',lastConfig=null,errors=[];
 function scope(config){
  let alive=true,depth=0;
  const observers=new Set(),timers=new Set(),attrs=new Map(),children=[],rules=new Map();
  const capture=new NativeMO(()=>{});
  const snapshot=value=>{const s=document.createElement('i').style;s.cssText=value||'';return s;};
  function journal(records){
   const first=new Map();
   for(const r of records){
    if(r.type==='childList'){children.push({parent:r.target,added:Array.from(r.addedNodes,n=>({node:n,text:n.nodeType===3?n.data:null})),removed:Array.from(r.removedNodes),next:r.nextSibling});continue;}
    if(r.type!=='attributes')continue;
    let keys=first.get(r.target);if(!keys){keys=new Map();first.set(r.target,keys);}if(!keys.has(r.attributeName))keys.set(r.attributeName,r.oldValue);
   }
   first.forEach((keys,el)=>keys.forEach((before,key)=>{
    let saved=attrs.get(el);if(!saved){saved=new Map();attrs.set(el,saved);}
    if(key==='style'){
     const old=snapshot(before),now=el.style;
     const names=new Set([...Array.from({length:old.length},(_,i)=>old[i]),...Array.from({length:now.length},(_,i)=>now[i])]);
     for(const name of names){const value=now.getPropertyValue(name),priority=now.getPropertyPriority(name);if(old.getPropertyValue(name)===value&&old.getPropertyPriority(name)===priority)continue;
      const id='style:'+name,prev=saved.get(id);
      const previous=prev&&prev.applied===old.getPropertyValue(name)&&prev.appliedPriority===old.getPropertyPriority(name)?prev:{value:old.getPropertyValue(name),priority:old.getPropertyPriority(name)};
      saved.set(id,{...previous,applied:value,appliedPriority:priority});
     }
    }else{const prev=saved.get(key);saved.set(key,{value:prev&&prev.applied===before?prev.value:before,applied:el.getAttribute(key)});}
   }));
  }
  function run(fn){
   if(!alive)return;
   if(depth)return fn();
   depth++;capture.observe(document,{subtree:true,attributes:true,attributeOldValue:true,childList:true});
   try{return fn();}catch(e){errors.push(String(e));errors=errors.slice(-12);}
   finally{journal(capture.takeRecords());capture.disconnect();depth--;}
  }
  const wrap=fn=>(...args)=>run(()=>fn(...args));
  class MO extends NativeMO{constructor(fn){super(wrap(fn));observers.add(this);}}
  const IO=window.IntersectionObserver?class extends window.IntersectionObserver{constructor(fn,options){super(wrap(fn),options);observers.add(this);}}:class{observe(){}unobserve(){}disconnect(){}};
  const timeout=(fn,delay)=>{const id=window.setTimeout(()=>{timers.delete(id);run(fn);},delay);timers.add(id);return id;};
  const rgb=hex=>({r:parseInt(hex.slice(1,3),16),g:parseInt(hex.slice(3,5),16),b:parseInt(hex.slice(5,7),16)});
  const primary=colors[config.color]||(config.dynamic&&/^#[\da-f]{6}$/i.test(config.systemAccent||'')?config.systemAccent:null);
  const onPrimary=config.color==='تلقائي'&&/^#[\da-f]{6}$/i.test(config.systemOnAccent||'')?config.systemOnAccent:(primary&&[rgb(primary).r,rgb(primary).g,rgb(primary).b].reduce((s,v,i)=>s+v*[.299,.587,.114][i],0)>150?'#111111':'#ffffff');
  const string=hex=>'rgb('+Object.values(rgb(hex)).join(', ')+')';
  const bridge={getMaterialYouPrimaryRgbString:()=>string(primary),getMaterialYouOnPrimaryRgbString:()=>string(onPrimary),getMaterialYouPrimaryRgb:()=>JSON.stringify(rgb(primary)),getMaterialYouOnPrimaryRgb:()=>JSON.stringify(rgb(onPrimary))};
  const isDesktopMode=()=>document.querySelector('html[id="facebook"]')!==null;
  const isFeed=()=>location.pathname==='/'&&['m.facebook.com','www.facebook.com'].includes(location.hostname)&&(isDesktopMode()||Array.from(document.querySelectorAll('[role="button"] span')).some(s=>s.textContent==='󱥆'));
  // Keep FPRO selection/media/progress styles outside broad upstream color walks.
  const allowed=el=>!el.closest('[id^="fpro"],.fpro-video-tools');
  const doc=new Proxy(document,{get(target,key){if(key==='querySelectorAll')return selector=>Array.from(target.querySelectorAll(selector)).filter(allowed);if(key==='querySelector')return selector=>Array.from(target.querySelectorAll(selector)).find(allowed)||null;const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;}});
  const win=new Proxy(window,{get(target,key){if(key==='document')return doc;if(key==='MaterialYouBridge')return bridge;if(key==='isDesktopMode')return isDesktopMode;if(key==='isFeed')return isFeed;if(key==='setTimeout')return timeout;const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;}});
  const protectedUI=el=>!el||el.matches('html,body,main,header,nav,[role="main"],[role="feed"],[role="navigation"],[role="banner"],.fpro-video-tools,[id^="fpro"]')||!!el.closest('form,dialog,[role="dialog"],[aria-modal="true"]')||!!el.querySelector('form,input,textarea,select,[aria-label="Search"],[aria-label="بحث"],.fpro-video-tools');
  const api={run,wrap,primary,protectedUI,hide(el){if(!protectedUI(el))el.style.display='none';},remove(el){if(!protectedUI(el))el.remove();},body:document.body,url:location.href,
   cssRule(style,key,value){if(!rules.has(style))rules.set(style,new Map());const m=rules.get(style),old=m.get(key);m.set(key,{value:old?old.value:style.getPropertyValue(key),priority:old?old.priority:style.getPropertyPriority(key),applied:value});style.setProperty(key,value);},
   mount(name){run(()=>factories[name](win,doc,MO,IO,timeout,isDesktopMode,isFeed,api));},
   stop(){alive=false;for(const ob of observers)ob.disconnect();for(const id of timers)window.clearTimeout(id);capture.disconnect();
    // Reverse replacement/removal in order, preserving original node identity/listeners.
    for(const action of children.reverse()){
     if(!action.added.every(a=>a.node.parentNode===action.parent&&(a.text===null||a.node.data===a.text)))continue;
     for(const a of action.added)a.node.remove();
     for(const node of action.removed)if(!node.isConnected)action.parent.insertBefore(node,action.next&&action.next.parentNode===action.parent?action.next:null);
    }
    attrs.forEach((keys,el)=>keys.forEach((old,key)=>{
     if(key.startsWith('style:')){const prop=key.slice(6);if(el.style.getPropertyValue(prop)!==old.applied||el.style.getPropertyPriority(prop)!==old.appliedPriority)return;if(old.value)el.style.setProperty(prop,old.value,old.priority);else el.style.removeProperty(prop);}
     else if(el.getAttribute(key)===old.applied){if(old.value===null)el.removeAttribute(key);else el.setAttribute(key,old.value);}
    }));
    rules.forEach((keys,style)=>keys.forEach((old,key)=>{if(style.getPropertyValue(key)===old.applied){if(old.value)style.setProperty(key,old.value,old.priority);else style.removeProperty(key);}}));
    attrs.clear();children.length=0;observers.clear();timers.clear();rules.clear();
   },report(){return {observers:observers.size,timers:timers.size,elements:attrs.size,childChanges:children.length};}
  };return api;
 }
 function update(config,force=false){
  if(window.FproPrompt)window.FproPrompt.update(config);
  const next=JSON.stringify(config);if(next===signature&&!force)return;
  signature=next;lastConfig={...config};if(active){active.stop();active=null;}
  if(config.siteEngine!=='upstream'||config.enhance===false||!document.body)return;
  active=scope(config);
  for(const [flag,file] of [['amoled','amoled_black'],['ads','adblock'],['suggested','hide_suggested'],['people','hide_pymk'],['groups','hide_groups'],['reels','hide_reels'],['sticky','sticky_navbar']])if(config[flag])active.mount(file);
  if(config.stories||config.homeStories&&location.pathname==='/')active.mount('hide_stories');
  if(config.appBanner&&!window.FproPrompt){active.mount('bottom_banner');active.mount('open_app_glyph');}
  if(config.referenceEngine!==false&&config.color!=='طبيعي'&&active.primary){active.mount('material_you');if(config.experimentalColorVars)active.run(()=>{const tokenStyle=document.createElement('style');tokenStyle.id='fpro-upstream-tokens';tokenStyle.textContent=':root{'+['--accent','--primary-blue','--blue-link','--primary-button-background','--primary-deemphasized-button-text'].map(k=>k+':'+active.primary+'!important').join(';')+'}';document.head.append(tokenStyle);});}
 }
 const host=new NativeMO(()=>{if(active&&(active.body!==document.body||active.url!==location.href))update(lastConfig,true);});
 host.observe(document,{childList:true,subtree:true});
 for(const name of ['popstate','hashchange'])window.addEventListener(name,()=>{if(lastConfig)update(lastConfig,true);});
 window.FproSiteEngine={update,report:()=>({engine:'Materialbook/Nobook',active:!!active,...active?active.report():{},errors:errors.slice()})};
})();
