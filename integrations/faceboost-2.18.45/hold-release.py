from pathlib import Path
import sys
base=Path(sys.argv[1])/'app/src/main'
p=base/'res/raw/reel_gestures.js';s=p.read_text()
needle='    // A single tap is held back'
at=s.index(needle)
s=s[:at]+'''    // One owner, one cleanup. A new touch must never overwrite an accelerated owner.
    const releaseHold = () => {
        const s = st; st = null;
        if (!s) return;
        clearTimeout(s.timer); clearInterval(s.dog);
        if (s.held) {
            try { s.v.playbackRate = Number.isFinite(s.rate0) && s.rate0 > 0 ? s.rate0 : 1; } catch (_) {}
            hideBadge(); swallowUntil = Date.now() + 500;
        }
    };
    window.__mbReleaseHold = releaseHold;
    window.__mbReleaseHeldOnly = () => {
        if (!st) return;
        clearTimeout(st.timer);
        if (st.held) releaseHold();
    };
    // Window capture runs before document handlers and before the click-swallow guard.
    ['touchend','touchcancel','pointerup','pointercancel'].forEach(name => window.addEventListener(name, e => {
        if (!e.isTrusted || !st || !st.held) return;
        if (name === 'touchend' && e.touches && e.touches.length) return;
        releaseHold();
    }, {capture:true,passive:true}));
    window.addEventListener('blur', releaseHold, true);
    window.addEventListener('pagehide', releaseHold, true);
    window.addEventListener('popstate', releaseHold, true);
    document.addEventListener('visibilitychange', () => { if(document.hidden)releaseHold(); }, true);

'''+s[at:]
s=s.replace("    document.addEventListener('touchstart', (e) => {", "    document.addEventListener('touchstart', (e) => {\n        releaseHold();",1)
s=s.replace("if (inReel() && document.contains(s.v)) return;", "if (inReel() && document.contains(s.v) && (!s.source || s.source === (s.v.currentSrc || s.v.getAttribute('src') || ''))) return;")
s=s.replace('            st.rate0 = v.playbackRate;', "            st.rate0 = v.playbackRate;\n            st.source = v.currentSrc || v.getAttribute('src') || '';")
p.write_text(s)
p=base/'java/com/almekhlafi/materialbook/utils/BackgroundAudioWebView.kt';s=p.read_text();needle='    @Volatile var keepAlive = false';s=s.replace(needle,needle+'''

    private val holdReleaseHandler = android.os.Handler(android.os.Looper.getMainLooper())

    // Android receives UP/CANCEL even when a website capture handler swallows DOM release.
    override fun dispatchTouchEvent(event: android.view.MotionEvent): Boolean {
        val terminal = event.actionMasked == android.view.MotionEvent.ACTION_UP ||
            event.actionMasked == android.view.MotionEvent.ACTION_CANCEL
        return try { super.dispatchTouchEvent(event) } finally {
            if (terminal) holdReleaseHandler.post { runCatching { evaluateJavascript("window.__mbReleaseHeldOnly?.();", null) } }
        }
    }
''');p.write_text(s)
