package com.almekhlafi.FPRO

import android.content.Intent
import android.os.SystemClock
import android.view.View
import android.view.ViewGroup
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import org.junit.Assert.*
import org.junit.Assume.assumeTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class WebViewUpgradeRegressionTest {
    private fun browser(view: View): WebView? {
        if (view is WebView) return view
        if (view is ViewGroup) for (i in 0 until view.childCount) browser(view.getChildAt(i))?.let { return it }
        return null
    }
    private fun waitFor(scenario: ActivityScenario<MainActivity>, predicate: (MainActivity) -> Boolean) {
        val deadline = SystemClock.elapsedRealtime() + 8_000
        while (SystemClock.elapsedRealtime() < deadline) {
            var passed = false
            scenario.onActivity { passed = predicate(it) }
            if (passed) return
            SystemClock.sleep(50)
        }
        fail("Expected browser state did not arrive")
    }
    @androidx.test.filters.SdkSuppress(minSdkVersion = 26)
    @Test fun rendererCallbackReplacesBrowserAndBoundsAutomaticReloads() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        ActivityScenario.launch<MainActivity>(Intent(context, MainActivity::class.java)).use { scenario ->
            awaitBrowserReady(scenario)
            scenario.onActivity { activity ->
                val detail = object : android.webkit.RenderProcessGoneDetail() {
                    override fun didCrash() = false
                    override fun rendererPriorityAtExit() = WebView.RENDERER_PRIORITY_BOUND
                }
                val first = requireNotNull(browser(activity.window.decorView))
                val firstClient = first.webViewClient
                assertTrue(firstClient.onRenderProcessGone(first, detail))
                val second = requireNotNull(browser(activity.window.decorView))
                assertNotSame("Recovery must never reuse the dead instance", first, second)
                assertTrue(second.webViewClient.onRenderProcessGone(second, detail))
                val third = requireNotNull(browser(activity.window.decorView))
                assertNotSame(second, third)
                val failure = MainActivity::class.java.getDeclaredField("failure\$delegate").apply { isAccessible = true }
                val state = failure.get(activity) as androidx.compose.runtime.State<*>
                assertNotNull("Second death must require explicit retry", state.value)
                // Late callbacks for an already disposed instance must be harmless.
                assertTrue(firstClient.onRenderProcessGone(first, detail))
                assertSame(third, browser(activity.window.decorView))
            }
        }
    }

    @Test fun messageBridgeRejectsSameOriginSubframesAndMalformedPayloads() {
        assumeTrue(androidx.webkit.WebViewFeature.isFeatureSupported(androidx.webkit.WebViewFeature.WEB_MESSAGE_LISTENER))
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        ActivityScenario.launch<MainActivity>(Intent(context, MainActivity::class.java)).use { scenario ->
            awaitBrowserReady(scenario)
            val loaded = CountDownLatch(1)
            scenario.onActivity { activity ->
                val web = requireNotNull(browser(activity.window.decorView))
                web.stopLoading()
                web.webViewClient = object : WebViewClient() {
                    override fun onPageFinished(view: WebView, url: String?) { loaded.countDown() }
                }
                web.loadDataWithBaseURL("https://m.facebook.com/", "<html><body>Bridge fixture</body></html>", "text/html", "UTF-8", null)
            }
            assertTrue(loaded.await(10, TimeUnit.SECONDS))
            val field = MainActivity::class.java.getDeclaredField("mediaPlaying").apply { isAccessible = true }
            fun send(script: String) { scenario.onActivity { requireNotNull(browser(it.window.decorView)).evaluateJavascript(script, null) } }
            send("FproPlayback.postMessage(JSON.stringify({playing:true}))")
            waitFor(scenario) { field.getBoolean(it) }
            send("FproPlayback.postMessage(JSON.stringify({playing:false}))")
            waitFor(scenario) { !field.getBoolean(it) }
            val frameDone = CountDownLatch(1)
            scenario.onActivity { activity ->
                requireNotNull(browser(activity.window.decorView)).evaluateJavascript("""
                    (async()=>{
                      FproPlayback.postMessage('not json');
                      FproPlayback.postMessage(JSON.stringify({playing:'true'}));
                      const frame=document.createElement('iframe');
                      const loaded=new Promise(resolve=>frame.onload=resolve);
                      frame.srcdoc='<html><body>Same origin child</body></html>';document.body.appendChild(frame);
                      await loaded;frame.contentWindow.FproPlayback.postMessage(JSON.stringify({playing:true}));
                      window.bridgeFrameSent=true;
                    })()
                """.trimIndent(), null)
                activity.window.decorView.postDelayed({ frameDone.countDown() }, 500)
            }
            assertTrue(frameDone.await(3, TimeUnit.SECONDS))
            val done = CountDownLatch(1)
            scenario.onActivity { activity ->
                requireNotNull(browser(activity.window.decorView)).evaluateJavascript("window.bridgeFrameSent===true") {
                    assertEquals("Frame must actually send its message", "true", it)
                    assertFalse("Subframes and malformed messages have no native authority", field.getBoolean(activity))
                    done.countDown()
                }
            }
            assertTrue(done.await(5, TimeUnit.SECONDS))
        }
    }
}
