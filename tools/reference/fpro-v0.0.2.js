/*
 * FPRO v0.0.2 — سكربت الحقن داخل فيسبوك (محرك GoldBook الخاص بنا)
 * ES5 خالص — يعمل على WebView أندرويد 6.0 حتى أحدث إصدار.
 *
 * هذا الإصدار يدمج أنظمة GoldBook المجربة حرفياً:
 *   1) قاتل لافتة «فتح التطبيق» — نسخة LITE (قانون أداء 10.3.0)
 *   2) نظام الحجب والإخفاء الخاص بنا: طي الحروف العربية (أإآ→ا ة→ه ى→ي)
 *      + المحددات الهيكلية المجربة ميدانياً (data-srat / hscroller / native-text…)
 *      + إظهار فوري عند إطفاء أي مفتاح (بلا إعادة تحميل)
 *   3) محرك التلوين الخاص بنا: كشف أزرق فيسبوك واستبداله باللون المختار
 *      («طبيعي» = لا تلوين إطلاقاً — فيسبوك الأصلي)
 *   4) شريط التقدم قوس قزح v13.1: 9 ألوان متدفقة + كرة ⚽ + تلميح وقت + سحب للتنقل
 *   5) زر تنزيل شفاف فوق زر الإعجاب + زر ⬇ قابل للسحب على الفيديو + لوحة عائمة
 *   6) قانون المراقب الواحد: مراقب مُبطَّل واحد لكل شيء (10.3.0)
 */
(function () {
  'use strict';

  var PREV = window.__FPRO_STOP__;
  if (PREV) { try { PREV(); } catch (e) {} }

  var F = window.Fpro;
  if (!F) return;

  var cfg = {};
  var tickTimer = null, gearTimer = null, mo = null;
  var flushTimer = null, pendingRoots = [];
  var copyBound = false;
  var lastStateKey = '', lastBar = '';
  var lpTimer = null;
  var stickyTick = 0;
  var RTL = false;

  // =====================================================================
  //  أدوات مساعدة
  // =====================================================================

  function on(el, ev, fn, opt) {
    try { el.addEventListener(ev, fn, opt || false); } catch (e) {}
  }
  function off(el, ev, fn, opt) {
    try { el.removeEventListener(ev, fn, opt || false); } catch (e) {}
  }
  function byId(id) { return document.getElementById(id); }
  function rm(id) { var e = byId(id); if (e && e.parentNode) e.parentNode.removeChild(e); }
  function safe(fn) { try { fn(); } catch (e) {} }

  function rgbToHex(c) {
    try {
      var m = /rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)(?:[, ]+([\d.]+))?\)/.exec(c);
      if (!m) return null;
      if (m[4] !== undefined && parseFloat(m[4]) < 0.4) return null;
      var h = (((m[1] | 0) & 255) << 16 | ((m[2] | 0) & 255) << 8 | ((m[3] | 0) & 255)).toString(16);
      while (h.length < 6) h = '0' + h;
      return '#' + h;
    } catch (e) { return null; }
  }

  /* التسوية العربية الخاصة بنا: حذف التشكيل والتطويل + طي الحروف
   * (أإآ→ا · ة→ه · ى→ي) + توحيد المسافات + توحيد الحالة.
   * هكذا «اعلان» تطابق «إعلان» و«مموله» تطابق «ممولة» — بكل تشكيلاتها. */
  function norm(s) {
    return (s || '')
      .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
      .replace(/[\u0623\u0625\u0622]/g, '\u0627')
      .replace(/\u0629/g, '\u0647')
      .replace(/\u0649/g, '\u064A')
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function hexToRgb(h) {
    h = (h || '').replace('#', '');
    if (h.length !== 6) return null;
    return {
      r: parseInt(h.substring(0, 2), 16),
      g: parseInt(h.substring(2, 4), 16),
      b: parseInt(h.substring(4, 6), 16)
    };
  }

  // =====================================================================
  //  CSS الديناميكي (أنظمتنا البصرية)
  // =====================================================================

  function applyCss() {
    rm('fpro-css');
    var css = ''
      // ⚙️ زر الإعدادات — فوق شعار فيسبوك
      + '.fpro-gear{position:fixed;z-index:2147483000;width:32px;height:32px;border-radius:50%;'
      +   'background:rgba(18,20,28,.58);box-shadow:0 1px 8px rgba(0,0,0,.35);'
      +   'display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;'
      +   '-webkit-justify-content:center;justify-content:center;cursor:pointer;'
      +   '-webkit-tap-highlight-color:transparent;opacity:.92}'
      + '.fpro-gear:active{opacity:1}'
      + '.fpro-gear svg{width:19px;height:19px;display:block}'
      // ⬇ زر التنزيل على الفيديو — شفاف قابل للسحب
      + '.fpro-dl{position:absolute;width:38px;height:38px;border-radius:50%;'
      +   'background:rgba(0,0,0,.38);color:#fff;font-size:17px;line-height:38px;'
      +   'text-align:center;z-index:2147483000;cursor:pointer;opacity:.5;'
      +   '-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;'
      +   'box-shadow:0 1px 6px rgba(0,0,0,.3)}'
      + '.fpro-dl:active{opacity:1}'
      + '.fpro-dl.drag{opacity:1;border:2px solid ' + (cfg.uiAccent || '#D4AF37') + '}'
      // ⬇ رقاقة التنزيل الشفافة — فوق زر الإعجاب (مواصفتنا الأصلية)
      + '.fpro-chip{position:absolute;z-index:2147482998;width:32px;height:32px;'
      +   'border-radius:50%;background:transparent;color:inherit;opacity:.45;'
      +   'font-size:16px;line-height:32px;text-align:center;cursor:pointer;'
      +   '-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none}'
      + '.fpro-chip:active{opacity:1}'
      // 🌈 شريط التقدم قوس قزح — هوية v13.1 الخاصة بنا
      + '.fpro-rb{position:absolute;left:0;right:0;bottom:0;height:26px;pointer-events:none;'
      +   'z-index:2147482999}'
      + '.fpro-rb-track{position:relative;height:24px;pointer-events:auto;touch-action:none;'
      +   'cursor:pointer;-webkit-user-select:none;user-select:none}'
      + '.fpro-rb-bg{position:absolute;left:6px;right:6px;top:10px;height:4px;border-radius:12px;'
      +   'background:rgba(255,255,255,.45);box-shadow:inset 0 1px 2px rgba(0,0,0,.35);'
      +   'transition:height .12s ease,top .12s ease}'
      + '.fpro-rb-fill{position:absolute;left:6px;top:10px;height:4px;border-radius:12px;max-width:calc(100% - 12px);'
      +   'background:linear-gradient(90deg,#ff0000,#ff8a00,#ffee00,#4dff00,#00ffd0,#0066ff,#8000ff,#ff00c8,#ff0000);'
      +   'background-size:300% 100%;-webkit-animation:fprorw 2.8s linear infinite;animation:fprorw 2.8s linear infinite;'
      +   'transition:height .12s ease,top .12s ease}'
      + '@-webkit-keyframes fprorw{0%{background-position:0% 50%}100%{background-position:300% 50%}}'
      + '@keyframes fprorw{0%{background-position:0% 50%}100%{background-position:300% 50%}}'
      + '.fpro-rb-ball{position:absolute;top:12px;font-size:16px;line-height:1;'
      +   '-webkit-transform:translate(-50%,-50%);transform:translate(-50%,-50%);'
      +   'text-shadow:0 1px 3px rgba(0,0,0,.65),0 0 2px rgba(0,0,0,.4);'
      +   'transition:font-size .12s ease,top .12s ease}'
      + '.fpro-rb-time{position:absolute;bottom:100%;left:50%;-webkit-transform:translateX(-50%);'
      +   'transform:translateX(-50%);margin-bottom:3px;background:rgba(0,0,0,.78);color:#fff;'
      +   'font:500 9px/1.3 -apple-system,Roboto,sans-serif;padding:2px 6px;border-radius:5px;'
      +   'white-space:nowrap;opacity:0;transition:opacity .12s ease;pointer-events:none}'
      // الحالة النشطة: الشريط يسمك والكرة تكبر والتلميح يظهر (v13.1)
      + '.fpro-rb-track.fpro-rb-active .fpro-rb-bg{height:6px;top:9px}'
      + '.fpro-rb-track.fpro-rb-active .fpro-rb-fill{height:6px;top:9px}'
      + '.fpro-rb-track.fpro-rb-active .fpro-rb-ball{font-size:20px;top:12px}'
      + '.fpro-rb-track.fpro-rb-active .fpro-rb-time{opacity:1}'
      // إخفاء أدوات WebView الأصلية حيث شريطنا حيّ (v10 من محركنا)
      + '.fpro-hasrb video::-webkit-media-controls{display:none !important}'
      + '.fpro-hasrb video::-webkit-media-controls-enclosure{display:none !important}'
      + '.fpro-hasrb video::-webkit-media-controls-panel{display:none !important}'
      // احترام تقليل الحركة (معايرة 3 من محركنا)
      + '@media (prefers-reduced-motion: reduce){'
      + '.fpro-rb-fill{-webkit-animation:none !important;animation:none !important}}';

    // ==== حجب هيكلي (محدداتنا المجربة) ====
    if (cfg.blockReels) {
      css += 'a[href*="/reels"]{display:none !important}'
           + '[data-sigil*="reel"],[data-sigil*="Reel"]{display:none !important}';
    }
    if (cfg.blockStories) {
      css += '[data-sigil="stories"],[data-sigil="stories-tray"]{display:none !important}'
           + '[data-mcomponent="MContainer"][data-srat="43"]{display:none !important}'
           + '.x193iq5w.xgmub6v.x1ceravr{display:none !important}';
    }

    // ==== AMOLED أسود نقي (نظامنا: القيم المجربة من amoled_black) ====
    if (cfg.amoled) {
      css += 'html,body{background:#000 !important;color-scheme:dark}'
           + '[style*="18191A"],[style*="18191a"],[style*="#18191A"],[style*="#18191a"]'
           + ',[style*="242526"],[style*="242526"],[style*="#242526"],[style*="242527"]'
           + ',[style*="1C1E21"],[style*="1c1e21"],[style*="3A3B3C"],[style*="3a3b3c"]'
           + ',[style*="2A2B2C"],[style*="2a2b2c"]'
           + ',[style*="rgb(24, 25, 26)"],[style*="rgb(36, 37, 38)"]'
           + ',[style*="rgb(28, 30, 33)"],[style*="rgb(58, 59, 60)"]'
           + ',[style*="rgba(36,37,38,1"],[style*="rgba(24,25,26,1"]'
           + '{background-color:#000 !important;background-image:none !important}';
    }

    // العرض النظيف (نقر مزدوج)
    css += 'html.fpro-clean [role="banner"],html.fpro-clean header'
         + ',html.fpro-clean #header,html.fpro-clean nav[role="navigation"]'
         + ',html.fpro-clean .fpro-gear,html.fpro-clean .fpro-mfab{display:none !important}';
    // وضع صورة داخل صورة
    css += 'html.fpro-pip [role="banner"],html.fpro-pip header,html.fpro-pip #header'
         + ',html.fpro-pip nav[role="navigation"],html.fpro-pip .fpro-gear'
         + ',html.fpro-pip .fpro-dl,html.fpro-pip .fpro-chip,html.fpro-pip .fpro-mfab'
         + ',html.fpro-pip .fpro-rb{display:none !important}';

    var st = document.createElement('style');
    st.id = 'fpro-css';
    st.type = 'text/css';
    st.appendChild(document.createTextNode(css));
    (document.head || document.documentElement).appendChild(st);
  }

  // =====================================================================
  //  ⚙️ زر الإعدادات — فوق شعار FACEBOOK مباشرة
  // =====================================================================

  var GEAR_SVG = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">'
    + '<path fill="COLOR" d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-4.4c-0.24,0-0.43,0.17-0.47,0.41L8.85,5.35C8.27,5.59,7.73,5.92,7.23,6.3L4.84,5.34c-0.22-0.08-0.47,0-0.59,0.22L2.33,8.87 C2.21,9.08,2.27,9.35,2.46,9.49l2.03,1.58C4.44,11.37,4.42,11.69,4.42,12s0.02,0.63,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.18,2.54 c0.04,0.24,0.23,0.41,0.47,0.41h4.4c0.24,0,0.44-0.17,0.48-0.41l0.18-2.54c0.58-0.24,1.12-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>';

  function gearSetup() {
    rm('fpro-gear');
    var g = document.createElement('div');
    g.id = 'fpro-gear';
    g.className = 'fpro-gear';
    g.setAttribute('role', 'button');
    g.setAttribute('aria-label', 'إعدادات FPRO');
    g.innerHTML = GEAR_SVG.replace('COLOR', cfg.uiAccent || '#D4AF37');
    document.body.appendChild(g);

    // نقرة: فتح الإعدادات · ضغط مطول: إدارة التنزيلات
    var lp = null, fired = false;
    on(g, 'click', function () {
      if (fired) { fired = false; return; }
      safe(function () { F.openSettings(); });
    });
    on(g, 'touchstart', function () {
      fired = false;
      lp = setTimeout(function () {
        fired = true;
        safe(function () { F.vibrate(30); });
        safe(function () { F.openDownloads(); });
      }, 450);
    });
    on(g, 'touchend', function () { clearTimeout(lp); });
    on(g, 'touchmove', function () { clearTimeout(lp); fired = false; });

    gearPlace(g);
    clearInterval(gearTimer);
    gearTimer = setInterval(function () { safe(function () { gearPlace(byId('fpro-gear')); }); }, 2000);
  }

  function gearPlace(g) {
    if (!g || !document.body) return;
    var banner = document.querySelector('[role="banner"]')
              || document.querySelector('header')
              || document.body;
    var mark = banner.querySelector('a[aria-label*="acebook"]')
             || banner.querySelector('h1')
             || banner.querySelector('svg[aria-label]')
             || banner.querySelector('a[href="/"]');
    var x, y;
    if (mark) {
      var r = mark.getBoundingClientRect();
      x = r.left + r.width / 2 - 16;
      y = r.top - 36;
    } else {
      x = (RTL ? 10 : window.innerWidth - 42);
      y = 6;
    }
    if (y < 2) y = 2;
    if (x < 4) x = 4;
    if (x > window.innerWidth - 36) x = window.innerWidth - 36;
    g.style.left = Math.round(x) + 'px';
    g.style.top = Math.round(y) + 'px';
  }

  // =====================================================================
  //  💀 قاتل لافتة «فتح التطبيق» — نسخة LITE (نظامنا المجرب)
  //     مراقب واحد مُبطَّل يعالج العقد المضافة فقط + جدول صيد محدود
  //     [1s, 3s, 7s] + إعادة صيد عند تنقل SPA. صفر interval دائم.
  // =====================================================================

  var NOAPP = {
    PHRASES: {
      'فتح التطبيق': 1, 'افتح التطبيق': 1, 'فتح تطبيق فيسبوك': 1,
      'فتح فيسبوك': 1, 'فتح التطبيق الآن': 1, 'استخدم التطبيق': 1,
      'فتح التطبيق.': 1,
      'Open the app': 1, 'Open app': 1, 'Open App': 1, 'OPEN APP': 1,
      'Open in app': 1, 'Open in App': 1, 'Use the app': 1, 'Use App': 1
    },
    CHIP_PHRASES: {
      'فيسبوك الأصلي': 1, 'الفيسبوك الأصلي': 1, 'فيسبوك الأصلي.': 1,
      'تطبيق فيسبوك الأصلي': 1, 'استخدم تطبيق فيسبوك': 1,
      'Original Facebook': 1, 'Open Facebook': 1, 'Open Facebook app': 1,
      'Open the Facebook app': 1, 'Use Facebook App': 1, 'Use the Facebook app': 1
    },
    CTA_START_RE: /^(فتح\s+التطبيق|افتح\s+التطبيق|فتح\s+تطبيق\s+فيسبوك|افتحها?\s+في\s+التطبيق|افتحه\s+في\s+التطبيق|استخدم\s+التطبيق|استخدم\s+تطبيق\s+فيسبوك|استخدم\s+فيسبوك|جرب\s+التطبيق|حمّ?ل\s+التطبيق|تحميل\s+التطبيق|تحميل\s+تطبيق\s+فيسبوك|ثبّ?ت\s+التطبيق|شاهد\s+في\s+التطبيق|التطبيق\s+(?:أسرع|افضل|أفضل)|فتح\s+التطبيق\s+الآن|open\s+(the\s+)?app|open\s+(?:it\s+)?in\s+(the\s+)?app|open\s+facebook(?:\s+app)?|use\s+(the\s+)?(?:facebook\s+)?app|try\s+the\s+app|get\s+the\s+app|install\s+(the\s+)?app|download\s+(the\s+)?app|watch\s+on\s+the\s+app)/i,
    DEEPLINK_RE: /^(fb:|market:|intent:)/i,
    STORELINK_RE: /apps\.android\.com|apps\.apple\.com|play\.google\.com\/store\/apps\/details\?id=com\.facebook\.|onelink\.to\/facebook/i,
    BACK_HINT_RE: /^(رجوع|الرجوع|عُد|عودة|العودة|إغلاق|اغلاق|إخفاء|back|go\s+back|close|dismiss)/i,
    TRIGGER_RE: /فيسبوك|فيس بوك|التطبيق|تطبيق|استخدم|فتح|افتح|open\s+(the\s+)?app|open\s+facebook|facebook/i,
    KILLED: 'data-fpro-noapp',
    SEL: 'a, button, [role="button"], [role="link"], [aria-label], [tabindex], [onclick]',

    normT: function (s) {
      return (s || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
    },

    // رأس الوسم (≤70 حرفاً) بجمع مبكر — رخيص حتى داخل حاويات ضخمة
    labelHead: function (el) {
      try {
        var aria = el.getAttribute('aria-label') || '';
        var s = aria ? aria + ' ' : '';
        if (s.length < 70) {
          var walk = [el], i = 0;
          while (i < walk.length && s.length < 70) {
            var n = walk[i++];
            for (var c = n.firstChild; c; c = c.nextSibling) {
              if (s.length >= 70) break;
              if (c.nodeType === 3) s += c.nodeValue + ' ';
              else if (c.nodeType === 1) walk.push(c);
            }
          }
        }
        return NOAPP.normT(s);
      } catch (e) { return ''; }
    },

    hideNode: function (el) {
      try {
        if (!el || el.nodeType !== 1 || el.hasAttribute(NOAPP.KILLED)) return;
        el.setAttribute(NOAPP.KILLED, '1');
        el.style.setProperty('display', 'none', 'important');
        // تنظيف الفراغ المحجوز (روح Layer E — بخطوتين فقط بلا مراقب)
        var p = el.parentElement, n = 0;
        for (var i = 0; i < 3 && p && p !== document.body; i++) {
          n = 0;
          for (var c = p.firstElementChild; c; c = c.nextElementSibling)
            if (!c.hasAttribute || !c.hasAttribute(NOAPP.KILLED)) n++;
          if (n === 0) { p.style.setProperty('display', 'none', 'important'); p.setAttribute(NOAPP.KILLED, '1'); p = p.parentElement; }
          else break;
        }
      } catch (e) {}
    },

    // تسلّق البانر: أخف سلف بحجم بانر (≤32% من الشاشة)
    climbHide: function (el) {
      try {
        var node = el, best = null;
        var limit = Math.max(160, window.innerHeight * 0.32);
        for (var i = 0; i < 8; i++) {
          node = node.parentElement;
          if (!node || node === document.body || node === document.documentElement) break;
          var r = node.getBoundingClientRect();
          if (r.height > 0 && r.height <= limit) best = node;
          else if (r.height > limit) break;
        }
        NOAPP.hideNode(best || el);
      } catch (e) {}
    },

    // غلاف الحبّة الضيق (≤110px ارتفاعاً، ≤65% عرضاً)
    topPillHide: function (el) {
      try {
        var pill = el, node = el;
        for (var i = 0; i < 4; i++) {
          var p = node.parentElement;
          if (!p || p === document.body || p === document.documentElement) break;
          var r = p.getBoundingClientRect();
          if (r.height > 0 && r.height <= 110 && r.width > 0 && r.width <= window.innerWidth * 0.65) {
            pill = p; node = p;
          } else break;
        }
        NOAPP.hideNode(pill);
      } catch (e) {}
    },

    inTopChrome: function (el) {
      try { return el.getBoundingClientRect().top < window.innerHeight * 0.20; }
      catch (e) { return true; }
    },

    isBluePainted: function (el) {
      try {
        var cs = getComputedStyle(el);
        var srcs = [cs.backgroundColor, cs.backgroundImage];
        try {
          srcs.push(getComputedStyle(el, '::before').backgroundColor);
          srcs.push(getComputedStyle(el, '::after').backgroundColor);
        } catch (e2) {}
        for (var i = 0; i < srcs.length; i++) {
          var m = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(srcs[i] || '');
          if (m) {
            var r = +m[1], g = +m[2], b = +m[3];
            if (b >= 140 && (b - r) >= 40 && (b - g) >= 40) return true;
          }
        }
      } catch (e) {}
      return false;
    },

    findBluePill: function (el) {
      try {
        var node = el;
        for (var i = 0; i < 7; i++) {
          if (!node || node === document.body || node === document.documentElement) break;
          if (NOAPP.isBluePainted(node)) {
            var r = node.getBoundingClientRect();
            if (r.width > 30 && r.width <= window.innerWidth * 0.72
                    && r.height >= 22 && r.height <= 120) return node;
            return null;
          }
          node = node.parentElement;
        }
      } catch (e) {}
      return null;
    },

    checkEl: function (el) {
      try {
        if (!el || el.nodeType !== 1 || el.hasAttribute(NOAPP.KILLED)) return;
        var t = NOAPP.labelHead(el);
        if (!t.length) return;

        // 1) العبارات الدقيقة — مساراتنا المجربة
        var exact = NOAPP.PHRASES[t] || NOAPP.CHIP_PHRASES[t];
        if (exact) {
          var r0 = el.getBoundingClientRect();
          var isChip = !!NOAPP.CHIP_PHRASES[t]
                  || (r0.width > 0 && r0.width < window.innerWidth * 0.6
                      && (r0.top + r0.height / 2) < window.innerHeight * 0.2);
          if (isChip) NOAPP.topPillHide(el); else NOAPP.climbHide(el);
          return;
        }

        // 2) روابط المتجر/التطبيق العميقة أو صيغة الحث من أول السطر
        if (el.tagName === 'A') {
          var href = el.getAttribute('href') || '';
          if (href && (NOAPP.DEEPLINK_RE.test(href) || NOAPP.STORELINK_RE.test(href))) {
            if (NOAPP.BACK_HINT_RE.test(t)) return;
            if (!NOAPP.inTopChrome(el)) { NOAPP.climbHide(el); return; }
          }
        }
        if (t.length <= 90 && NOAPP.CTA_START_RE.test(t)) {
          if (NOAPP.inTopChrome(el)) NOAPP.topPillHide(el); else NOAPP.climbHide(el);
          return;
        }

        // 3) هيكلي: كلمة إطلاق + قرب الأعلى + حبة زرقاء سلفية
        if (t.length <= 80 && NOAPP.TRIGGER_RE.test(t)) {
          var r = el.getBoundingClientRect();
          if (r.width > 0 && r.height > 0
                  && (r.top + r.height / 2) < window.innerHeight * 0.30) {
            var pill = NOAPP.findBluePill(el);
            if (pill) NOAPP.topPillHide(pill);
          }
        }
      } catch (e) {}
    },

    scanRoot: function (root) {
      try {
        if (!root || root.nodeType !== 1 || !root.querySelectorAll) return;
        if (document.hidden) return;
        if (root.matches && root.matches(NOAPP.SEL)) NOAPP.checkEl(root);
        var els = root.querySelectorAll(NOAPP.SEL);
        for (var i = 0; i < els.length; i++) NOAPP.checkEl(els[i]);
      } catch (e) {}
    },

    hunt: function () {
      if (!cfg.noOpenApp) return;
      NOAPP.scanRoot(document.body);
    },

    // جدول الصيد المحدود المتلاشي [1s, 3s, 7s]
    schedule: function () {
      if (!cfg.noOpenApp) return;
      setTimeout(function () { NOAPP.hunt(); }, 1000);
      setTimeout(function () { NOAPP.hunt(); }, 3000);
      setTimeout(function () { NOAPP.hunt(); }, 7000);
    },

    // إلغاء كل ما قتلَه القاتل (عند إطفاء المفتاح أو الإيقاف)
    restore: function () {
      try {
        var els = document.querySelectorAll('[' + NOAPP.KILLED + ']');
        for (var i = 0; i < els.length; i++) {
          els[i].removeAttribute(NOAPP.KILLED);
          els[i].style.removeProperty('display');
        }
      } catch (e) {}
    }
  };

  // =====================================================================
  //  🚫 نظام الحجب والإخفاء الخاص بنا
  //     قوائم كلمات بطيّ الحروف + محددات هيكلية مجربة + إظهار عند الإطفاء
  // =====================================================================

  var LISTS = [
    { key: 'blockAds', words: [
        'إعلان', 'اعلان', 'ممول', 'ممولة', 'مموله', 'بيانات مقدمة من', 'مقدمة من',
        'رعاية', 'ممول بواسطة', 'إعلان مدفوع', 'اعلان مدفوع',
        'sponsored', 'paid for by', 'gesponsert', 'publicidad', 'publicité',
        'sponsorizzato', 'patrocinado', 'patrocinado pelo facebook',
        'реклама', '赞助内容', '広告', '광고', 'anzeige'
      ] },
    { key: 'blockSuggested', words: [
        'منشورات مقترحة', 'مقترح لك', 'مقترحة لك', 'اقتراحات', 'منشور مقترح',
        'مشاركات مقترحة', 'suggested for you', 'suggested posts'
      ] },
    { key: 'blockReels', words: [
        'ريلز', 'مقاطع ريلز', 'reels', 'reels and short videos', 'فيديوهات قصيرة'
      ] },
    { key: 'blockStories', words: [ 'القصص', 'قصص', 'stories' ] },
    { key: 'blockPym', words: [
        'أشخاص قد تعرفهم', 'اشخاص قد تعرفهم', 'أشخاص ربما تعرفهم', 'صديق مقترح',
        'people you may know', 'أشخاص ممكن أن تعرفهم'
      ] },
    { key: 'blockGroups', words: [
        'مجموعات مقترحة', 'مجموعات قد تنضم إليها', 'مجموعات من الممكن أن تنضم إليها',
        'suggested groups', 'مجموعات مقترحة لك'
      ] }
  ];

  function findCard(el) {
    var p = el, i = 0;
    while (p && i < 7) {
      p = p.parentElement;
      if (!p || p === document.body || p === document.documentElement) break;
      var role = p.getAttribute && (p.getAttribute('role') || '');
      if (role === 'article' || p.tagName === 'ARTICLE') return p;
      var h = p.offsetHeight || 0;
      if (h > 150 && h < 4000 && p.getAttribute('data-fpro-card') !== '0') return p;
      i++;
    }
    return null;
  }

  function hideEl(t) {
    if (!t || t.nodeType !== 1) return;
    if (t.hasAttribute('data-fpro-hidden')) return;
    t.setAttribute('data-fpro-prev', t.style.display || '');
    t.setAttribute('data-fpro-hidden', '1');
    t.style.setProperty('display', 'none', 'important');
  }

  /** إظهار كل ما أخفاه نظام الحجب — عند أي تغيير في الإعدادات (بلا إعادة تحميل) */
  function unhideAll() {
    try {
      var els = document.querySelectorAll('[data-fpro-hidden]');
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        var p = el.getAttribute('data-fpro-prev');
        el.style.display = (p && p !== 'none') ? p : '';
        el.removeAttribute('data-fpro-hidden');
        el.removeAttribute('data-fpro-prev');
        // مسح وسوم الفحص على العنصر وكل أحفاده — حتى يعاد تقييمها عند التفعيل
        el.__fproH = 0;
        var all = el.querySelectorAll('*');
        for (var k = 0; k < all.length; k++) all[k].__fproH = 0;
      }
    } catch (e) {}
  }

  function blockScan() {
    if (document.hidden) return;
    var i, j, k, q;

    // ==== 1) المحددات الهيكلية المجربة ميدانياً (من محرك GoldBook) ====
    try {
      // إعلانات سطح المكتب — إزالة مباشرة
      if (cfg.blockAds) {
        var dsk = document.querySelectorAll('div.sponsored_ad, article[data-ft*="sponsored_ad"]');
        for (i = 0; i < dsk.length; i++) dsk[i].parentNode && dsk[i].parentNode.removeChild(dsk[i]);
      }
      // أشخاص قد تعرفهم داخل الأخبار — .hscroller المجربة
      if (cfg.blockPym && window.location.pathname === '/') {
        var hs = document.querySelectorAll('.hscroller');
        for (i = 0; i < hs.length && i < 40; i++) {
          var cont = hs[i].closest('[data-tracking-duration-id]');
          if (cont) hideEl(cont);
        }
      }
      // المنشورات المقترحة — فاصل «•» في native-text (m.facebook)
      if (cfg.blockSuggested && window.location.pathname === '/') {
        var dots = document.querySelectorAll('div[data-mcomponent="TextArea"] .native-text > span');
        for (i = 0, j = 0; i < dots.length && j < 120; i++) {
          if ((dots[i].textContent || '').trim() !== '•') continue;
          j++;
          var sug = dots[i].closest('div[data-tracking-duration-id]');
          if (sug) {
            hideEl(sug);
            if (sug.previousElementSibling) hideEl(sug.previousElementSibling);
          }
        }
      }
    } catch (e) {}

    // ==== 2) مطابقة الكلمات (بطيّ الحروف العربي) ====
    var active = [];
    for (i = 0; i < LISTS.length; i++) {
      if (cfg[LISTS[i].key]) active.push(LISTS[i]);
    }
    if (!active.length) return;
    var els = document.querySelectorAll(
      'h2,h3,h4,strong,b,span,div[role="heading"],div[aria-label],a[aria-label],header h1');
    var n = 0;
    for (j = 0; j < els.length && n < 500; j++) {
      var el = els[j];
      if (el.__fproH) continue;
      n++;
      var txt = norm(el.getAttribute('aria-label') || '') || norm(el.textContent || '');
      if (!txt || txt.length > 70) { el.__fproH = 1; continue; }
      var hit = false;
      for (k = 0; k < active.length && !hit; k++) {
        var w = active[k].words;
        for (q = 0; q < w.length; q++) {
          if (txt.indexOf(norm(w[q])) !== -1) { hit = true; break; }
        }
      }
      el.__fproH = 1;
      if (hit) {
        var card = findCard(el);
        hideEl(card || el);
        if (card) card.__fproH = 1;
      }
    }
  }

  // =====================================================================
  //  🎨 محرك التلوين الخاص بنا — كشف أزرق فيسبوك واستبداله
  //     («طبيعي» = لا يُحقن هذا المحرك إطلاقاً — فيسبوك الأصلي)
  // =====================================================================

  var RC = {
    BG_RE: /background-color\s*:\s*(rgba\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d*\.?\d+)\s*\)|rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)|#([0-9a-fA-F]{6}))/gi,
    COLOR_RE: /(?:(?:^|;)\s*|;)(color)\s*:\s*(rgba\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d*\.?\d+)\s*\)|rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)|#([0-9a-fA-F]{6}))/gi,
    BORDER_RE: /border(?:-color)?\s*:\s*(?:\d+px\s+solid\s+)?(rgba\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d*\.?\d+)\s*\)|rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)|#([0-9a-fA-F]{6}))/gi,

    isFacebookBlue: function (r, g, b) {
      var max = Math.max(r, g, b), min = Math.min(r, g, b);
      return b > r + 40 && b > g + 20 && (max - min) > 60 && b > 100;
    },

    rgb: function () { return hexToRgb(cfg.uiAccent || '#D4AF37'); },

    // تمريرة على كتل <style> — كل كتلة مرة واحدة فقط
    passStyles: function () {
      var c = RC.rgb();
      if (!c) return;
      var sts = document.querySelectorAll('style');
      for (var i = 0; i < sts.length && i < 120; i++) {
        var st = sts[i];
        if (st.__fproRs || !st.textContent || st.id.indexOf('fpro') === 0) continue;
        st.__fproRs = 1;
        var html = st.textContent;
        var out = html.replace(RC.BG_RE, function (m, rgbaAll, rr, rg2, rb, ra, r, g, b, hex) {
          if (r && g && b && RC.isFacebookBlue(+r, +g, +b)) return 'background-color:' + cfg.uiAccent;
          if (hex && RC.isFacebookBlue(
                parseInt(hex.substring(0, 2), 16),
                parseInt(hex.substring(2, 4), 16),
                parseInt(hex.substring(4, 6), 16))) return 'background-color:' + cfg.uiAccent;
          if (rgbaAll && RC.isFacebookBlue(+rr, +rg2, +rb))
            return 'background-color: rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + (+ra || 1) + ')';
          return m;
        });
        out = out.replace(RC.BORDER_RE, function (m, rgbaAll, rr, rg2, rb, ra, r, g, b, hex) {
          if (r && g && b && RC.isFacebookBlue(+r, +g, +b)) return 'border-color:' + cfg.uiAccent;
          if (hex && RC.isFacebookBlue(
                parseInt(hex.substring(0, 2), 16),
                parseInt(hex.substring(2, 4), 16),
                parseInt(hex.substring(4, 6), 16))) return 'border-color:' + cfg.uiAccent;
          if (rgbaAll && RC.isFacebookBlue(+rr, +rg2, +rb))
            return 'border-color: rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + (+ra || 1) + ')';
          return m;
        });
        if (out !== html) { try { st.textContent = out; } catch (e) {} }
      }
    },

    // تمريرة على السمات inline — محدودة العدد
    passAttrs: function () {
      var c = RC.rgb();
      if (!c) return;
      var els = document.querySelectorAll('[style*="color"]');
      var n = 0;
      for (var i = 0; i < els.length && n < 400; i++) {
        var el = els[i];
        if (el.__fproRa) continue;
        if (el.className && ('' + el.className).indexOf && ('' + el.className).indexOf('fpro') === 0) continue;
        var s = el.getAttribute('style') || '';
        if (!s) continue;
        n++;
        var out = s.replace(RC.BG_RE, function (m, rgbaAll, rr, rg2, rb, ra, r, g, b, hex) {
          if (r && g && b && RC.isFacebookBlue(+r, +g, +b)) return 'background-color:' + cfg.uiAccent;
          if (hex && RC.isFacebookBlue(
                parseInt(hex.substring(0, 2), 16),
                parseInt(hex.substring(2, 4), 16),
                parseInt(hex.substring(4, 6), 16))) return 'background-color:' + cfg.uiAccent;
          return m;
        });
        out = out.replace(RC.COLOR_RE, function (m, k, rgbaAll, rr, rg2, rb, ra, r, g, b, hex) {
          if (r && g && b && RC.isFacebookBlue(+r, +g, +b)) return k + ':' + cfg.uiAccent;
          if (hex && RC.isFacebookBlue(
                parseInt(hex.substring(0, 2), 16),
                parseInt(hex.substring(2, 4), 16),
                parseInt(hex.substring(4, 6), 16))) return k + ':' + cfg.uiAccent;
          return m;
        });
        if (out !== s) {
          try { el.setAttribute('style', out); } catch (e) {}
          el.__fproRa = 1;
        }
      }
    },

    setup: function () {
      rm('fpro-rc');
      if (!cfg.recolor) return; // «طبيعي» = صفر تلوين
      var st = document.createElement('style');
      st.id = 'fpro-rc';
      st.type = 'text/css';
      // متغيرات فيسبوك الرسمية (تعمل على www + m)
      st.appendChild(document.createTextNode(
        ':root{--primary-button-background:' + (cfg.uiAccent || '#D4AF37')
        + ';--accent:' + (cfg.uiAccent || '#D4AF37')
        + ';--primary-blue:' + (cfg.uiAccent || '#D4AF37')
        + ';--primary-icon:' + (cfg.uiAccent || '#D4AF37')
        + ';--primary-deemphasized-button-text:' + (cfg.uiAccent || '#D4AF37') + '}'
      ));
      (document.head || document.documentElement).appendChild(st);
    },

    pass: function () {
      if (!cfg.recolor || document.hidden) return;
      RC.passStyles();
      RC.passAttrs();
    },

    cleanup: function () { rm('fpro-rc'); }
  };

  // =====================================================================
  //  🌈 شريط التقدم قوس قزح — هوية v13.1 الخاصة بنا
  //     9 ألوان متدفقة + كرة ⚽ + تلميح وقت + سحب للتنقل
  // =====================================================================

  function fmtTime(sec) {
    if (!isFinite(sec) || isNaN(sec) || sec < 0) return '0:00';
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function makeRainbow(v) {
    if (v.__fproRb) return;
    v.__fproRb = 1;
    var c = v.parentElement || v.parentNode;
    if (!c || c.nodeType !== 1) return;

    var w = document.createElement('div');
    w.className = 'fpro-rb';
    var track = document.createElement('div');
    track.className = 'fpro-rb-track';
    track.setAttribute('role', 'slider');
    track.setAttribute('aria-label', 'شريط التقدم');
    var bg = document.createElement('div');
    bg.className = 'fpro-rb-bg';
    var fill = document.createElement('div');
    fill.className = 'fpro-rb-fill';
    var ball = document.createElement('span');
    ball.className = 'fpro-rb-ball';
    ball.innerHTML = '\u26BD';
    var time = document.createElement('span');
    time.className = 'fpro-rb-time';
    time.innerHTML = '0:00';
    track.appendChild(bg);
    track.appendChild(fill);
    track.appendChild(ball);
    track.appendChild(time);
    w.appendChild(track);
    c.appendChild(w);
    c.className = (c.className || '') + ' fpro-hasrb';

    var seekTo = function (clientX) {
      try {
        var tr = track.getBoundingClientRect();
        if (!tr.width) return;
        var p = (clientX - tr.left) / tr.width;
        p = p < 0 ? 0 : (p > 1 ? 1 : p);
        if (isFinite(v.duration) && v.duration > 0) {
          v.currentTime = p * v.duration;
        }
      } catch (e) {}
    };

    var upd = function () {
      try {
        var p = (isFinite(v.duration) && v.duration > 0)
          ? (v.currentTime / v.duration) : 0;
        var tw = track.clientWidth || 1;
        fill.style.width = (p * 100) + '%';
        ball.style.left = (6 + (tw - 12) * p) + 'px';
        time.innerHTML = fmtTime(v.currentTime) + ' / ' + fmtTime(v.duration);
      } catch (e) {}
    };

    // سحب للتنقل (v13.1): تتبع اللمس مع استعادة حالة التشغيل
    var dragging = false, wasPlaying = false;
    on(track, 'touchstart', function (e) {
      dragging = true;
      wasPlaying = !v.paused && !v.ended;
      track.className = 'fpro-rb-track fpro-rb-active';
      if (e.touches && e.touches[0]) seekTo(e.touches[0].clientX);
    }, { passive: true });
    on(track, 'touchmove', function (e) {
      if (!dragging) return;
      if (e.preventDefault) e.preventDefault();
      if (e.touches && e.touches[0]) seekTo(e.touches[0].clientX);
    }, { passive: false });
    on(track, 'touchend', function () {
      dragging = false;
      track.className = 'fpro-rb-track';
      if (wasPlaying) { try { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } catch (e) {} }
    });

    on(v, 'timeupdate', upd);
    on(v, 'play', upd);
    on(v, 'loadedmetadata', upd);
    upd();
  }

  // =====================================================================
  //  ⬇️ أزرار التنزيل — زر شفاف فوق زر الإعجاب + زر على الفيديو قابل للسحب
  // =====================================================================

  function loadDlOffset() {
    try {
      var s = localStorage.getItem('fproDlOffset');
      if (!s) return null;
      var o = JSON.parse(s);
      if (typeof o.xp === 'number' && typeof o.yp === 'number') return o;
    } catch (e) {}
    return null;
  }

  function saveDlOffset(o) {
    try { localStorage.setItem('fproDlOffset', JSON.stringify(o)); } catch (e) {}
  }

  function defaultPosBtn(b) {
    var off = loadDlOffset();
    if (off) {
      b.style.left = Math.max(0, Math.min(88, off.xp)) + '%';
      b.style.top = Math.max(0, Math.min(92, off.yp)) + '%';
      b.style.bottom = 'auto';
      b.style.right = 'auto';
    } else {
      b.style.bottom = '44px'; // فوق شريط قوس قزح
      if (RTL) b.style.left = '14px'; else b.style.right = '14px';
    }
  }

  function makeDlBtn(container) {
    if (container.querySelector('.fpro-dl')) return;
    var b = document.createElement('div');
    b.className = 'fpro-dl';
    b.innerHTML = '⬇';
    b.setAttribute('aria-label', 'تنزيل الفيديو — FPRO');
    defaultPosBtn(b);
    container.appendChild(b);

    var lp = null, dragging = false, moved = false;

    on(b, 'touchstart', function () {
      moved = false;
      lp = setTimeout(function () {
        dragging = true;
        moved = true;
        b.className = 'fpro-dl drag';
        safe(function () { F.vibrate(25); });
      }, 450);
    }, { passive: true });

    on(b, 'touchmove', function (e) {
      if (dragging) {
        if (e.preventDefault) e.preventDefault();
        var t = e.touches[0];
        var cr = container.getBoundingClientRect();
        var x = ((t.clientX - cr.left) / (cr.width || 1)) * 100;
        var y = ((t.clientY - cr.top) / (cr.height || 1)) * 100;
        x = Math.max(0, Math.min(95, x));
        y = Math.max(0, Math.min(93, y));
        b.style.left = x + '%';
        b.style.top = y + '%';
        b.style.bottom = 'auto';
        b.style.right = 'auto';
      } else {
        clearTimeout(lp);
      }
    }, { passive: false });

    on(b, 'touchend', function () {
      clearTimeout(lp);
      if (dragging) {
        dragging = false;
        b.className = 'fpro-dl';
        var cr = container.getBoundingClientRect();
        var br = b.getBoundingClientRect();
        saveDlOffset({
          xp: ((br.left - cr.left) / (cr.width || 1)) * 100,
          yp: ((br.top - cr.top) / (cr.height || 1)) * 100
        });
        var all = document.querySelectorAll('.fpro-dl');
        for (var i = 0; i < all.length; i++) {
          if (all[i] !== b) defaultPosBtn(all[i]);
        }
        safe(function () { F.toast('تم حفظ موضع زر التنزيل ✓'); });
      }
    });

    on(b, 'click', function () {
      if (moved) { moved = false; return; }
      openDlPanel();
    });
  }

  // زر إعجاب؟ (عربي + الإنكليزيات الرئيسية) — لوضع رقاعتنا الشفافة فوقه
  var LIKE_RE = /^(اعجبني|أعجبني|الاعجاب|الإعجاب|اعجب بالرد|like($|\s)|j'aime|gef\u00e4llt mir|me gusta)/i;

  /** رقاقة ⬇ شفافة فوق زر الإعجاب في كل منشور — المواصفة الأصلية حرفياً */
  function attachLikeChips() {
    if (!cfg.dlEnabled || !cfg.dlButton || document.hidden) return;
    var btns = document.querySelectorAll('[role="button"][aria-label],button[aria-label]');
    var made = 0;
    for (var i = 0; i < btns.length && made < 25; i++) {
      var lb = btns[i];
      var label = lb.getAttribute('aria-label') || '';
      if (!LIKE_RE.test(norm(label))) continue;
      var article = lb.closest
        ? lb.closest('[role="article"],article,[data-tracking-duration-id]')
        : null;
      if (!article || article.querySelector('.fpro-chip')) continue;
      try {
        var pos = getComputedStyle(article).position;
        if (pos === 'static') article.style.position = 'relative';
      } catch (e) {}
      var chip = document.createElement('div');
      chip.className = 'fpro-chip';
      chip.innerHTML = '⬇';
      chip.setAttribute('aria-label', 'تنزيل هذا المنشور — FPRO');
      article.appendChild(chip);
      // الوضع: فوق زر الإعجاب مباشرة
      try {
        var ar = article.getBoundingClientRect(), lr = lb.getBoundingClientRect();
        var x = lr.left - ar.left + lr.width / 2 - 16;
        var y = lr.top - ar.top - 36;
        if (y < 2) y = lr.top - ar.top + lr.height + 6;
        chip.style.left = Math.max(2, x) + 'px';
        chip.style.top = y + 'px';
      } catch (e) {}
      on(chip, 'click', function () { openDlPanel(); });
      made++;
    }
  }

  function attachMedia() {
    var vs = document.querySelectorAll('video');
    for (var i = 0; i < vs.length; i++) {
      var v = vs[i];
      if (v.__fproAttached) continue;
      v.__fproAttached = 1;
      var c = v.parentElement || v.parentNode;
      if (!c || c.nodeType !== 1) continue;
      try {
        var pos = getComputedStyle(c).position;
        if (pos === 'static') c.style.position = 'relative';
      } catch (e) {}
      if (cfg.dlEnabled && cfg.dlButton) makeDlBtn(c);
    }
    if (cfg.rainbow) {
      for (var k = 0; k < vs.length; k++) makeRainbow(vs[k]);
    }
  }

  // =====================================================================
  //  التقاط روابط الفيديو المباشرة (fetch/XHR) لقائمة التنزيل
  // =====================================================================

  function netHook() {
    if (window.__FPRO_HOOKED__) return;
    window.__FPRO_HOOKED__ = true;
    window.__FPRO_NET__ = [];
    function note(u) {
      try {
        u = String(u);
        if (/\.(mp4|m3u8|mpd)(\?|$)/i.test(u) || (u.indexOf('video') !== -1 && u.indexOf('fbcdn') !== -1)) {
          var arr = window.__FPRO_NET__;
          for (var i = 0; i < arr.length; i++) if (arr[i].u === u) return;
          arr.unshift({ u: u, t: Date.now() });
          if (arr.length > 12) arr.pop();
        }
      } catch (e) {}
    }
    if (typeof window.fetch === 'function') {
      var of = window.fetch;
      window.fetch = function () {
        try { note(arguments[0]); } catch (e) {}
        return of.apply(this, arguments);
      };
    }
    try {
      var oo = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function (m, u) {
        try { note(u); } catch (e) {}
        return oo.apply(this, arguments);
      };
    } catch (e) {}
  }

  // =====================================================================
  //  لوحة التنزيل العائمة (داخل التطبيق دون مغادرة الصفحة)
  // =====================================================================

  function closeDlPanel() { rm('fpro-ov'); }

  function openDlPanel() {
    closeDlPanel();
    var ov = document.createElement('div');
    ov.id = 'fpro-ov';
    ov.style.cssText = 'position:fixed;left:0;top:0;right:0;bottom:0;'
      + 'background:rgba(0,0,0,.55);z-index:2147483001;'
      + 'display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;'
      + '-webkit-justify-content:center;justify-content:center';
    on(ov, 'click', function (e) { if (e.target === ov) closeDlPanel(); });

    var card = document.createElement('div');
    card.style.cssText = 'width:90%;max-width:430px;max-height:68vh;overflow:auto;'
      + 'border-radius:18px;background:' + (cfg.uiBg || '#3A3B3C') + ';'
      + 'color:' + (cfg.uiText || '#E4E6EB') + ';padding:14px;direction:rtl;'
      + 'box-shadow:0 12px 60px rgba(0,0,0,.55);font-family:system-ui,-apple-system,"Segoe UI",Tahoma,sans-serif;'
      + '-webkit-overflow-scrolling:touch';
    ov.appendChild(card);

    var head = document.createElement('div');
    head.style.cssText = 'display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;'
      + 'margin-bottom:10px;font-weight:700;font-size:15px';
    var ht = document.createElement('div');
    ht.innerHTML = '⬇ تنزيل الفيديو';
    ht.style.cssText = '-webkit-flex:1;flex:1';
    head.appendChild(ht);
    var x = document.createElement('div');
    x.innerHTML = '✕';
    x.style.cssText = 'font-size:18px;padding:2px 10px;cursor:pointer;opacity:.7';
    on(x, 'click', closeDlPanel);
    head.appendChild(x);
    card.appendChild(head);

    // بنود القائمة
    var items = [];
    var here = location.href;
    if (/facebook\.com/.test(location.hostname)) {
      items.push({ name: 'الرابط الحالي (ريل / مشاهدة / منشور)', url: here, page: true });
    }
    var net = window.__FPRO_NET__ || [];
    for (var i = 0; i < net.length; i++) {
      var u = net[i].u;
      var isHls = /\.(m3u8|mpd)(\?|$)/i.test(u);
      var tail = u.split('/').pop().split('?')[0];
      if (tail.length > 34) tail = tail.substring(0, 34) + '…';
      items.push({
        name: isHls ? ('بث مباشر (HLS): ' + tail) : ('فيديو مباشر: ' + tail),
        url: u, hls: isHls
      });
    }
    var vs = document.querySelectorAll('video');
    for (var k = 0; k < vs.length; k++) {
      var s = vs[k].currentSrc || vs[k].src || '';
      if (s && s.indexOf('blob:') !== 0) {
        var t2 = s.split('/').pop().split('?')[0];
        items.push({ name: 'عنصر فيديو: ' + (t2 ? t2.substring(0, 28) : 'video'), url: s });
      }
    }

    function btn(label, fn) {
      var b = document.createElement('div');
      b.textContent = label;
      b.style.cssText = 'display:inline-block;padding:7px 12px;border-radius:9px;'
        + 'background:' + (cfg.uiAccent || '#D4AF37') + ';color:' + (cfg.uiAccentOn || '#fff')
        + ';font-weight:700;font-size:12px;cursor:pointer;margin-inline-end:8px;'
        + 'margin-left:8px;-webkit-tap-highlight-color:transparent';
      on(b, 'click', fn);
      return b;
    }

    function row(it) {
      var r = document.createElement('div');
      r.style.cssText = 'background:' + (cfg.uiBg2 || '#232425') + ';border-radius:12px;'
        + 'padding:10px 12px;margin-bottom:8px;font-size:13px;'
        + 'border:1px solid ' + (cfg.uiBorder || '#3E4042');
      var nm = document.createElement('div');
      nm.style.cssText = 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'
        + 'margin-bottom:8px;font-size:12px;opacity:.9';
      nm.textContent = it.name;
      r.appendChild(nm);
      var bar = document.createElement('div');
      bar.appendChild(btn('↗ إرسال للتطبيق', function () {
        safe(function () { F.shareToApp(it.url, 'FPRO'); });
      }));
      // m3u8 = قائمة تشغيل نصية — التنزيل هنا للـ mp4 فقط (صدقاً)
      if (it.url && /\.mp4(\?|$)/i.test(it.url)) {
        bar.appendChild(btn('⬇ تنزيل هنا', function () {
          safe(function () {
            F.downloadInApp(it.url, 'FPRO_' + Date.now() + '.mp4');
          });
        }));
      }
      r.appendChild(bar);
      card.appendChild(r);
    }

    if (!items.length) {
      var e = document.createElement('div');
      e.style.cssText = 'opacity:.7;font-size:13px;padding:16px 4px;line-height:1.9';
      e.innerHTML = 'لم يُعثر على روابط فيديو مباشرة بعد.<br>'
        + 'شغّل الفيديو أو الريل ثم اضغط ⬇ مرة أخرى،'
        + 'أو أرسل رابط المنشور الحالي إلى تطبيق التنزيل الخارجي.';
      card.appendChild(e);
      var fb = document.createElement('div');
      fb.textContent = '↗ إرسال رابط الصفحة الحالية';
      fb.style.cssText = 'display:inline-block;padding:9px 14px;border-radius:10px;'
        + 'background:' + (cfg.uiAccent || '#D4AF37') + ';color:' + (cfg.uiAccentOn || '#fff')
        + ';font-weight:700;font-size:13px;cursor:pointer;margin-top:8px';
      on(fb, 'click', function () {
        safe(function () { F.shareToApp(location.href, 'FPRO'); });
      });
      card.appendChild(fb);
    } else {
      for (var q = 0; q < items.length; q++) row(items[q]);
    }

    var hint = document.createElement('div');
    hint.style.cssText = 'font-size:10.5px;opacity:.55;margin-top:6px;line-height:1.7';
    hint.innerHTML = '«إرسال للتطبيق» يحوّل الرابط لتطبيق التنزيل الخارجي المحدد في الإعدادات'
      + ' (⚙️ ← تنزيل الفيديو ← اسم الحزمة). «تنزيل هنا» يظهر في إدارة التنزيلات.';
    card.appendChild(hint);

    document.body.appendChild(ov);
  }

  // =====================================================================
  //  📋 نسخ نص المنشور بضغط مطول
  // =====================================================================

  function copyText(txt) {
    var done = false;
    function fb() {
      try {
        var ta = document.createElement('textarea');
        ta.value = txt;
        ta.setAttribute('readonly', 'readonly');
        ta.style.cssText = 'position:fixed;top:-999px;left:-999px;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      } catch (e) {}
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
        navigator.clipboard.writeText(txt);
        done = true;
      }
    } catch (e) {}
    if (!done) fb();
  }

  function copySetup() {
    if (copyBound) return; // منع تراكم المستمعين عند إعادة الحقن (خلل 0.0.1)
    copyBound = true;
    on(document, 'touchstart', function (e) {
      if (!cfg.copyText) return;
      if (e.touches.length > 1) return;
      var t = e.target;
      if (!t || !t.closest) return;
      if (t.closest('input,textarea,select,[contenteditable],button,a,[role="button"],video,img,canvas,.fpro-dl,.fpro-chip,.fpro-gear,.fpro-rb')) return;
      var x0 = e.touches[0].clientX, y0 = e.touches[0].clientY;
      lpTimer = setTimeout(function () {
        lpTimer = null;
        var p = t.closest('[role="article"],article,[data-compressed]') || t.parentElement;
        if (!p) return;
        var txt = (p.innerText || p.textContent || '').trim();
        if (!txt || txt.length < 15 || txt.length > 6000) return;
        copyText(txt);
        safe(function () { F.vibrate(30); });
        safe(function () { F.toast('تم نسخ نص المنشور ✓'); });
      }, 550);
      var cancel = function (ev) {
        if (ev && ev.touches && ev.touches[0]) {
          var dx = ev.touches[0].clientX - x0, dy = ev.touches[0].clientY - y0;
          if (dx * dx + dy * dy > 144) { clearTimeout(lpTimer); lpTimer = null; }
        } else {
          clearTimeout(lpTimer); lpTimer = null;
        }
      };
      on(document, 'touchmove', cancel);
      on(document, 'touchend', function () {
        clearTimeout(lpTimer); lpTimer = null;
        off(document, 'touchmove', cancel);
      });
    }, { passive: true });
  }

  // =====================================================================
  //  📌 شريط تنقل ثابت
  // =====================================================================

  function stickyApply() {
    var h = document.querySelector('[role="banner"]') || document.querySelector('header');
    if (!cfg.stickyNav) {
      rm('fpro-spacer');
      if (h && h.__fproFixed) {
        h.style.position = '';
        h.style.top = '';
        h.style.left = '';
        h.style.right = '';
        h.style.zIndex = '';
        h.__fproFixed = 0;
      }
      return;
    }
    if (!h) return;
    try {
      var pos = getComputedStyle(h).position;
      if (pos === 'fixed' || pos === 'sticky') return;
      var hh = h.offsetHeight || 48;
      var sp = byId('fpro-spacer');
      if (!sp) {
        sp = document.createElement('div');
        sp.id = 'fpro-spacer';
        sp.style.height = hh + 'px';
        (h.parentNode === document.body ? document.body : h.parentNode).insertBefore(sp, h);
      }
      h.style.position = 'fixed';
      h.style.top = '0';
      h.style.left = '0';
      h.style.right = '0';
      h.style.zIndex = '999';
      h.__fproFixed = 1;
    } catch (e) {}
  }

  // =====================================================================
  //  🔍 تكبير بإصبعين
  // =====================================================================

  function zoomFix() {
    if (!cfg.zoom) return;
    try {
      var m = document.querySelector('meta[name="viewport"]');
      if (!m) {
        m = document.createElement('meta');
        m.setAttribute('name', 'viewport');
        (document.head || document.documentElement).appendChild(m);
      }
      var c = m.getAttribute('content') || '';
      if (c.indexOf('user-scalable=yes') === -1) {
        m.setAttribute('content', 'width=device-width, initial-scale=1, minimum-scale=0.25, maximum-scale=10.0, user-scalable=yes');
      }
    } catch (e) {}
  }

  // =====================================================================
  //  ⏱️ الحلقة الدورية: حالة الصفحة + لون شريط الحالة
  // =====================================================================

  function anyVideoPlaying() {
    try {
      var vs = document.querySelectorAll('video');
      for (var i = 0; i < vs.length; i++) {
        if (!vs[i].paused && !vs[i].ended) return true;
      }
    } catch (e) {}
    return false;
  }

  function popupOpen() {
    try {
      var ds = document.querySelectorAll('[role="dialog"],[aria-modal="true"]');
      for (var i = 0; i < ds.length; i++) {
        if (ds[i].offsetParent !== null || ds[i].offsetHeight > 0) return true;
      }
    } catch (e) {}
    return false;
  }

  function tick() {
    if (document.hidden) return;
    try {
      var st = {
        top: (window.scrollY || 0) < 90,
        popup: popupOpen(),
        playing: anyVideoPlaying()
      };
      var key = st.top + '|' + st.popup + '|' + st.playing;
      if (key !== lastStateKey) {
        lastStateKey = key;
        F.pageState(JSON.stringify(st));
      }
      if (cfg.barFollow) {
        var h = document.querySelector('[role="banner"]') || document.querySelector('header');
        if (h) {
          var c = getComputedStyle(h).backgroundColor;
          var hex = rgbToHex(c);
          if (hex && hex !== lastBar) {
            lastBar = hex;
            F.setBarColor(hex);
          }
        }
      }
      zoomFix();
      if ((stickyTick++) % 4 === 0) stickyApply();
    } catch (e) {}
  }

  // =====================================================================
  //  👁️ المراقب الواحد — قانون 10.3.0: مُبطَّل واحد لكل شيء
  //     (الحجب + القاتل + الوسائط + التلوين + رقاقات الإعجاب)
  // =====================================================================

  function fullPass() {
    NOAPP.hunt();
    blockScan();
    attachMedia();
    attachLikeChips();
    RC.pass();
  }

  function flushPass() {
    flushTimer = null;
    if (document.hidden) { pendingRoots = []; return; }
    if (pendingRoots.length > 40) {
      pendingRoots = [];
      fullPass();
      return;
    }
    var roots = pendingRoots;
    pendingRoots = [];
    // معالجة الجذور غير المغطاة فقط (زيادة القاتل)
    for (var i = 0; i < roots.length; i++) {
      var covered = false;
      for (var j = 0; j < i; j++)
        if (roots[j] !== roots[i] && roots[j].contains && roots[j].contains(roots[i])) { covered = true; break; }
      if (!covered && roots[i].nodeType === 1) NOAPP.scanRoot(roots[i]);
    }
    blockScan();
    attachMedia();
    attachLikeChips();
    RC.pass();
  }

  function observerSetup() {
    if (mo) { try { mo.disconnect(); } catch (e) {} }
    mo = new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var added = muts[i].addedNodes;
        for (var j = 0; j < added.length; j++)
          if (added[j].nodeType === 1) pendingRoots.push(added[j]);
      }
      if (pendingRoots.length && !flushTimer) {
        flushTimer = setTimeout(flushPass, 300);
      }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });

    // إعادة صيد عند تنقل SPA (ريلز ↔ خلاصة ↔ watch) — حدث حقيقي لا مؤقت
    try {
      var push = history.pushState, replace = history.replaceState;
      history.pushState = function () { var r = push.apply(this, arguments); setTimeout(fullPass, 500); return r; };
      history.replaceState = function () { var r = replace.apply(this, arguments); setTimeout(fullPass, 500); return r; };
      on(window, 'popstate', function () { setTimeout(fullPass, 500); });
    } catch (e) {}
  }

  // =====================================================================
  //  واجهة الأصلي: نظيف / PiP / إغلاق المنبثقات / أعلى الصفحة
  // =====================================================================

  window.__fproCleanMode = function (onOff) {
    try {
      document.documentElement.classList[onOff ? 'add' : 'remove']('fpro-clean');
    } catch (e) {}
  };

  window.__fproPip = function (onOff) {
    try {
      document.documentElement.classList[onOff ? 'add' : 'remove']('fpro-pip');
    } catch (e) {}
  };

  window.__fproClosePopup = function () {
    try {
      var cands = document.querySelectorAll(
        '[role="dialog"] [aria-label="إغلاق"],[role="dialog"] [aria-label="Close"],'
        + '[role="dialog"] [aria-label*="إغلاق"],[role="dialog"] [aria-label*="Close"],'
        + '[aria-label="إغلاق"],[aria-label="Close"]');
      for (var i = 0; i < cands.length; i++) {
        if (cands[i].offsetParent !== null) { cands[i].click(); return true; }
      }
      document.dispatchEvent(new KeyboardEvent('keydown',
        { key: 'Escape', keyCode: 27, which: 27, bubbles: true }));
      return true;
    } catch (e) { return false; }
  };

  window.__fproToTop = function () {
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      try { window.scrollTo(0, 0); } catch (e2) {}
    }
  };

  // =====================================================================
  //  الإقلاع والتوقف
  // =====================================================================

  function readCfg() {
    try { cfg = JSON.parse(F.getSettings()); }
    catch (e) { cfg = {}; }
  }

  function stopAll() {
    clearInterval(tickTimer); tickTimer = null;
    clearInterval(gearTimer); gearTimer = null;
    clearTimeout(flushTimer); flushTimer = null;
    pendingRoots = [];
    if (mo) { try { mo.disconnect(); } catch (e) {} mo = null; }
    rm('fpro-gear'); rm('fpro-ov'); rm('fpro-spacer'); rm('fpro-css'); rm('fpro-rc');
    var i;
    var dls = document.querySelectorAll('.fpro-dl');
    for (i = 0; i < dls.length; i++) dls[i].parentNode && dls[i].parentNode.removeChild(dls[i]);
    var chips = document.querySelectorAll('.fpro-chip');
    for (i = 0; i < chips.length; i++) chips[i].parentNode && chips[i].parentNode.removeChild(chips[i]);
    var rbs = document.querySelectorAll('.fpro-rb');
    for (i = 0; i < rbs.length; i++) rbs[i].parentNode && rbs[i].parentNode.removeChild(rbs[i]);
    var html = document.documentElement;
    html.classList.remove('fpro-clean', 'fpro-pip');
  }

  window.__FPRO_STOP__ = stopAll;

  function boot(usePassed) {
    if (!usePassed) readCfg();
    RTL = (document.documentElement.getAttribute('dir') || document.dir || 'rtl') === 'rtl';
    unhideAll();          // إظهار ما حُجب — ثم يُعاد الحجب وفق المفاتيح الجديدة
    if (!cfg.noOpenApp) NOAPP.restore();
    applyCss();
    netHook();
    gearSetup();
    RC.setup();
    observerSetup();
    copySetup();
    stickyApply();
    zoomFix();
    NOAPP.schedule();     // جدول الصيد المحدود [1s, 3s, 7s]
    fullPass();
    clearInterval(tickTimer);
    tickTimer = setInterval(tick, 1600);
    tick();
  }

  window.__fproApply = function (j) {
    try { cfg = (typeof j === 'string') ? JSON.parse(j) : j; } catch (e) { return; }
    boot(true); // الإعداد المُمرَّر من الأصلي هو الحقيقة — لا يُطغى عليه
  };

  if (document.readyState === 'loading') {
    on(document, 'DOMContentLoaded', function () { safe(boot); });
  } else {
    boot();
  }
})();
