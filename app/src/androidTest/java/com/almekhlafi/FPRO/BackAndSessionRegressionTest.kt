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
            scenario.onActivity { a -> find(a.window.decorView)!!.loadDataWithBaseURL(base,
                "<!doctype html><meta name='viewport' content='width=device-width,initial-scale=1'><body>Offline history fixture</body>", "text/html", "UTF-8", null) }
            Thread.sleep(1200)
            val js: (String) -> String = { code ->
                val done = CountDownLatch(1); val result = AtomicReference("")
                scenario.onActivity { a -> find(a.window.decorView)!!.evaluateJavascript(code) { result.set(it); done.countDown() } }
                assertTrue("Renderer callback completed", done.await(12, TimeUnit.SECONDS)); result.get()
            }
            body(scenario, js)
        }
    }
    @Test fun messagesUsesExistingHistoryInsteadOfReloadingHome() = runCase("https://m.facebook.com/") { scenario, js ->
        js("history.pushState({},'', '/saved-post');history.pushState({},'', '/messages/thread');true")
        scenario.onActivity { it.onBackPressedDispatcher.onBackPressed() }
        Thread.sleep(600)
        assertEquals("\"/saved-post\"", js("location.pathname"))
    }
    @Test fun blockedRendererBackTimesOutOnceAndLateCallbackCannotNavigateAgain() = runCase { scenario, js ->
        js("history.pushState({},'', '/middle');history.pushState({},'', '/detail');true")
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
        js("history.pushState({},'', '/middle');history.pushState({},'', '/detail');true")
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
    }
}
