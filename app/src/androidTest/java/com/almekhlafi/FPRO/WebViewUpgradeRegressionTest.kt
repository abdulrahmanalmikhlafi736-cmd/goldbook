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
    private fun loadPlaybackFixture(scenario: ActivityScenario<MainActivity>) {
        val loaded = CountDownLatch(1)
        scenario.onActivity { activity ->
            val web = requireNotNull(browser(activity.window.decorView))
            web.stopLoading()
            val fixtureUrl = "https://m.facebook.com/fpro-bridge44-test"
            web.webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(view: WebView, request: android.webkit.WebResourceRequest): android.webkit.WebResourceResponse? {
                    if (request.url.toString() != fixtureUrl) return null
                    val html = "<html><body id='bridge44'><video id='fixtureVideo'></video></body></html>"
                    return android.webkit.WebResourceResponse("text/html", "UTF-8", html.byteInputStream())
                }
                override fun onPageFinished(view: WebView, url: String?) {
                    if (url == fixtureUrl) view.evaluateJavascript("!!document.getElementById('bridge44')") {
                        if (it == "true") loaded.countDown()
                    }
                }
            }
            web.loadUrl(fixtureUrl)
        }
        assertTrue(loaded.await(10, TimeUnit.SECONDS))
    }

    @Test fun playbackReportingTracksPageOnEveryProvider() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        ActivityScenario.launch<MainActivity>(Intent(context, MainActivity::class.java)).use { scenario ->
            awaitBrowserReady(scenario)
            loadPlaybackFixture(scenario)
            val field = MainActivity::class.java.getDeclaredField("mediaPlaying").apply { isAccessible = true }
            scenario.onActivity { activity ->
                val web = requireNotNull(browser(activity.window.decorView))
                val reporter = activity.assets.open("page-info.js").bufferedReader().use { it.readText() }
                web.evaluateJavascript("Object.defineProperties(document.getElementById('fixtureVideo'),{paused:{value:false,configurable:true},ended:{value:false},readyState:{value:4}});" + reporter, null)
            }
            waitFor(scenario) { field.getBoolean(it) }
            scenario.onActivity { activity ->
                requireNotNull(browser(activity.window.decorView)).evaluateJavascript("Object.defineProperty(document.getElementById('fixtureVideo'),'paused',{value:true,configurable:true});window.__fproReportPlayback();", null)
            }
            waitFor(scenario) { !field.getBoolean(it) }
        }
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
            loadPlaybackFixture(scenario)
            val field = MainActivity::class.java.getDeclaredField("mediaPlaying").apply { isAccessible = true }
            fun send(script: String) { scenario.onActivity { requireNotNull(browser(it.window.decorView)).evaluateJavascript(script, null) } }
            // Keep automatic page-info reporting consistent with the synthetic transport state.
            // Otherwise the real header probe correctly revokes a true hint on a page with no playing video.
            send("Object.defineProperties(document.getElementById('fixtureVideo'),{paused:{value:false,configurable:true},ended:{value:false},readyState:{value:4}});FproPlayback.postMessage(JSON.stringify({playing:true}))")
            waitFor(scenario) { field.getBoolean(it) }
            send("Object.defineProperty(document.getElementById('fixtureVideo'),'paused',{value:true,configurable:true});FproPlayback.postMessage(JSON.stringify({playing:false}))")
            waitFor(scenario) { !field.getBoolean(it) }
            val frameDone = CountDownLatch(1)
            scenario.onActivity { activity ->
                requireNotNull(browser(activity.window.decorView)).evaluateJavascript("""
                    (async()=>{
                      window.__fproReportPlayback=()=>{}; // Do not let a later header probe mask an illicit iframe update.
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
