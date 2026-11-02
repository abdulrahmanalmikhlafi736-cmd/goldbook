package com.almekhlafi.FPRO

import android.view.View
import android.view.ViewGroup
import android.webkit.WebView
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicReference

/** Offline Android history/renderer/state tests; not Facebook account acceptance. */
@RunWith(AndroidJUnit4::class)
class BackAndSessionRegressionTest {
    private fun find(v: View): WebView? {
        if (v is WebView) return v
        if (v is ViewGroup) for (i in 0 until v.childCount) find(v.getChildAt(i))?.let { return it }
        return null
    }
    private fun runCase(base: String = "https://fixture.invalid/", body: (ActivityScenario<MainActivity>, (String) -> String) -> Unit) {
        val inst = InstrumentationRegistry.getInstrumentation()
        ActivityScenario.launch<MainActivity>(android.content.Intent(inst.targetContext, MainActivity::class.java)).use { scenario ->
            awaitBrowserReady(scenario)
            val backReady = CountDownLatch(1)
            scenario.onActivity { a ->
                val until = android.os.SystemClock.uptimeMillis() + 10_000
                val handler = android.os.Handler(android.os.Looper.getMainLooper())
                val check = object : Runnable {
                    override fun run() {
                        if (a.onBackPressedDispatcher.hasEnabledCallbacks()) backReady.countDown()
                        else if (!a.isDestroyed && android.os.SystemClock.uptimeMillis() < until) handler.postDelayed(this, 50)
                    }
                }
                handler.post(check)
            }
            assertTrue("Compose BackHandler registered before exercising native Back", backReady.await(11, TimeUnit.SECONDS))
            scenario.onActivity { a -> find(a.window.decorView)!!.loadDataWithBaseURL(base,
                """<!doctype html><meta name='viewport' content='width=device-width,initial-scale=1'>
                <body style='margin:0'><button id='navigate' style='position:fixed;left:0;top:0;width:160px;height:60px' onpointerdown='window.tapCount=(window.tapCount||0)+1;window.lastTrusted=event.isTrusted;history.pushState({},"",window.nextPath)'>Navigate local fixture</button>
                <p style='margin-top:100px'>Offline history fixture with meaningful visible content. No account or external media is used. Every history transition is started by a real user tap.</p></body>""", "text/html", "UTF-8", null) }
            Thread.sleep(1200)
            val js: (String) -> String = { code ->
                val done = CountDownLatch(1); val result = AtomicReference("")
                scenario.onActivity { a -> find(a.window.decorView)!!.evaluateJavascript(code) { result.set(it); done.countDown() } }
                assertTrue("Renderer callback completed", done.await(12, TimeUnit.SECONDS)); result.get()
            }
            body(scenario, js)
        }
    }
    private fun navigate(scenario: ActivityScenario<MainActivity>, js: (String) -> String, path: String) {
        val inst = InstrumentationRegistry.getInstrumentation()
        js("window.nextPath=" + org.json.JSONObject.quote(path) + ";true")
        val deadline = android.os.SystemClock.elapsedRealtime() + 10_000
        var ready = false
        while (!ready && android.os.SystemClock.elapsedRealtime() < deadline) {
            scenario.onActivity { a ->
                ready = MainActivity::class.java.getDeclaredField("pageConfirmed").apply { isAccessible = true }.getBoolean(a)
            }
            if (!ready) Thread.sleep(50)
        }
        assertTrue("Browser content shown before trusted touch", ready)
        val scale = AtomicReference(1f)
        val coordinates = org.json.JSONObject(js("JSON.stringify({width:innerWidth})").let { org.json.JSONArray("[$it]").getString(0) })
        val xy = FloatArray(2)
        val drawn = CountDownLatch(1)
        scenario.onActivity { a ->
            val web = find(a.window.decorView)!!; val loc = IntArray(2); web.getLocationOnScreen(loc)
            scale.set((web.width / coordinates.getDouble("width")).toFloat())
            xy[0] = loc[0] + 70 * scale.get(); xy[1] = loc[1] + 30 * scale.get()
            web.postVisualStateCallback(700, object : WebView.VisualStateCallback() { override fun onComplete(requestId: Long) { drawn.countDown() } })
        }
        assertTrue(drawn.await(10, TimeUnit.SECONDS))
        val down = android.os.SystemClock.uptimeMillis()
        for (kind in listOf(android.view.MotionEvent.ACTION_DOWN, android.view.MotionEvent.ACTION_UP)) {
            val event = android.view.MotionEvent.obtain(down, android.os.SystemClock.uptimeMillis(), kind, xy[0], xy[1], 0)
            event.source = android.view.InputDevice.SOURCE_TOUCHSCREEN
            assertTrue(inst.uiAutomation.injectInputEvent(event, true)); event.recycle()
        }
        var committed = false
        var nativeInfo = ""
        var observed = org.json.JSONObject()
        while (!committed && android.os.SystemClock.elapsedRealtime() < deadline) {
            observed = org.json.JSONObject(org.json.JSONArray("["+js("JSON.stringify({path:location.pathname,taps:window.tapCount||0,trusted:!!window.lastTrusted})")+"]").getString(0))
            scenario.onActivity { a ->
                val web = find(a.window.decorView)!!; val list = web.copyBackForwardList()
                nativeInfo = "url=${web.url}, index=${list.currentIndex}, size=${list.size}"
                committed = observed.optString("path") == path && observed.optBoolean("trusted") && web.canGoBack()
            }
            if (!committed) Thread.sleep(50)
        }
        assertTrue("Trusted navigation committed to native WebView history: $path; DOM=$observed; native=$nativeInfo", committed)
        assertEquals(org.json.JSONObject.quote(path), js("location.pathname"))
    }
    @Test fun messagesUsesExistingHistoryInsteadOfReloadingHome() = runCase("https://m.facebook.com/") { scenario, js ->
        navigate(scenario, js, "/saved-post")
        navigate(scenario, js, "/messages/thread")
        scenario.onActivity { it.onBackPressedDispatcher.onBackPressed() }
        Thread.sleep(600)
        assertEquals("\"/saved-post\"", js("location.pathname"))
    }
    @Test fun blockedRendererBackTimesOutOnceAndLateCallbackCannotNavigateAgain() = runCase { scenario, js ->
        navigate(scenario, js, "/middle")
        navigate(scenario, js, "/detail")
        scenario.onActivity { a ->
            // Deliberately occupy the real renderer, not Android's UI thread.
            find(a.window.decorView)!!.evaluateJavascript("(()=>{const until=Date.now()+2400;while(Date.now()<until){};return true;})()", null)
            a.onBackPressedDispatcher.onBackPressed()
            a.onBackPressedDispatcher.onBackPressed()
        }
        Thread.sleep(3400)
        assertEquals("Only one Back despite timeout + late callback + repeated press", "\"/middle\"", js("location.pathname"))
    }
    @Test fun boundedStateRestoresHistoryWithoutChangingLiveHistory() = runCase { scenario, js ->
        navigate(scenario, js, "/middle")
        navigate(scenario, js, "/detail")
        scenario.onActivity { a ->
            val web = find(a.window.decorView)!!
            val before = web.copyBackForwardList()
            val saved = requireNotNull(WebViewStateSnapshot.capture(web))
            val parcel = android.os.Parcel.obtain()
            try { parcel.writeBundle(saved); assertTrue(parcel.dataSize() <= WebViewStateSnapshot.MAX_BYTES) }
            finally { parcel.recycle() }
            assertEquals(before.size, web.copyBackForwardList().size)
            assertEquals(before.currentIndex, web.copyBackForwardList().currentIndex)
            val other = WebView(a)
            try { assertNotNull(other.restoreState(saved)); assertTrue(other.canGoBack()) }
            finally { other.destroy() }
        }
        assertEquals("\"/detail\"", js("location.pathname"))
        js("for(let i=0;i<160;i++)history.pushState({payload:'x'.repeat(16384)},'', '/bulk/'+i);true")
        val deadline = android.os.SystemClock.elapsedRealtime() + 5000
        var large = false
        while (!large && android.os.SystemClock.elapsedRealtime() < deadline) {
            scenario.onActivity { large = find(it.window.decorView)!!.copyBackForwardList().size > 16 }
            if (!large) Thread.sleep(50)
        }
        assertTrue("Many-entry history actually committed (provider may cap total entries)", large)
        scenario.onActivity { a ->
            val web = find(a.window.decorView)!!
            val before = web.copyBackForwardList()
            val bounded = WebViewStateSnapshot.capture(web)
            if (bounded != null) {
                val p = android.os.Parcel.obtain()
                try { p.writeBundle(bounded); assertTrue(p.dataSize() <= WebViewStateSnapshot.MAX_BYTES) }
                finally { p.recycle() }
            }
            if (before.size > 128 && !androidx.webkit.WebViewFeature.isFeatureSupported(androidx.webkit.WebViewFeature.SAVE_STATE)) assertNull("Old provider skips oversized history", bounded)
            assertEquals(before.size, web.copyBackForwardList().size)
            assertEquals(before.currentIndex, web.copyBackForwardList().currentIndex)
        }
    }
}
