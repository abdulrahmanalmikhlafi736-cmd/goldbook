package com.almekhlafi.FPRO

import android.content.Context
import android.content.ContextWrapper
import android.os.Bundle
import android.view.View
import android.view.ViewGroup
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.lifecycle.Lifecycle
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicReference

@RunWith(AndroidJUnit4::class)
class BrowsingSessionRegressionTest {
    @Test fun privateHistorySurvivesTenMinutesAndExpiresSafely() {
        val app = ApplicationProvider.getApplicationContext<Context>()
        val folder = File(app.cacheDir, "session-test-${System.nanoTime()}").apply { mkdirs() }
        val context = object : ContextWrapper(app) { override fun getFilesDir(): File = folder }
        val store = BrowsingSessionStore(context)
        try {
            val now = System.currentTimeMillis()
            val url = "https://m.facebook.com/"
            val position = """{"v":1,"url":"$url","y":1760}"""
            val history = Bundle().apply { putString("fixtureHistory", "kept") }
            store.write(history, position, url, now)!!.get(5, TimeUnit.SECONDS)
            val restored = store.read(now + 10 * 60 * 1000L)
            assertNotNull("A ten-minute absence must not expire the checkpoint", restored)
            assertEquals(position, restored!!.position)
            assertEquals("kept", restored.history.getString("fixtureHistory"))
            assertNull(store.read(now + BrowsingSessionStore.MAX_AGE_MS + 1))
            assertNull(store.read(now - 1))
            for (bad in listOf("https://evil.invalid/", "https://facebook.com.evil/", "https://m.facebook.com/login.php", "https://m.facebook.com/logout.php", "https://m.facebook.com/checkpoint/")) {
                assertFalse(BrowsingSessionStore.eligible(bad))
                assertNull(store.write(history, position, bad))
            }
            File(folder, "browsing-session-v1").writeBytes(byteArrayOf(1, 2, 3))
            assertNull("Corrupt private state must fall back without crashing", store.read(now))
            store.clear().get(5, TimeUnit.SECONDS)
            assertNull(store.read(now))
        } finally { store.close(); folder.deleteRecursively() }
    }
    @Test fun fullscreenStartsPortraitAndOnlyLaterPhysicalTurnUnlocksLandscape() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        ActivityScenario.launch<MainActivity>(android.content.Intent(instrumentation.targetContext, MainActivity::class.java)).use { scenario ->
            scenario.onActivity { activity ->
                assertEquals(android.content.pm.ActivityInfo.SCREEN_ORIENTATION_PORTRAIT, activity.requestedOrientation)
                val web = requireNotNull(findWeb(activity.window.decorView))
                val chrome = requireNotNull(web.webChromeClient)
                var hidden = false
                chrome.onShowCustomView(View(activity), android.webkit.WebChromeClient.CustomViewCallback { hidden = true })
                assertEquals(android.content.pm.ActivityInfo.SCREEN_ORIENTATION_PORTRAIT, activity.requestedOrientation)
                activity.onFullscreenOrientation(90)
                assertEquals("Initial landscape must not flip fullscreen", android.content.pm.ActivityInfo.SCREEN_ORIENTATION_PORTRAIT, activity.requestedOrientation)
                activity.onFullscreenOrientation(0)
                activity.onFullscreenOrientation(90)
                assertEquals(android.content.pm.ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE, activity.requestedOrientation)
                activity.onFullscreenOrientation(0)
                assertEquals(android.content.pm.ActivityInfo.SCREEN_ORIENTATION_PORTRAIT, activity.requestedOrientation)
                chrome.onHideCustomView()
                assertTrue("Fullscreen callback must be released", hidden)
                assertEquals(android.content.pm.ActivityInfo.SCREEN_ORIENTATION_PORTRAIT, activity.requestedOrientation)
            }
        }
    }
    private fun findWeb(view: View): WebView? {
        if (view is WebView) return view
        if (view is ViewGroup) for (i in 0 until view.childCount) findWeb(view.getChildAt(i))?.let { return it }
        return null
    }
    @Test fun realWebViewRestoresScrollAndWarmResumeAndRotationKeepDocument() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        ActivityScenario.launch<MainActivity>(android.content.Intent(instrumentation.targetContext, MainActivity::class.java)).use { scenario ->
            // Match the existing overlay fixture: let Compose issue its one-time
            // bootstrap navigation before installing the offline test document.
            // Otherwise API29 can replace our fixture with that queued home load.
            Thread.sleep(2300)
            val done = CountDownLatch(1)
            val result = AtomicReference("null")
            val originalActivity = AtomicReference<MainActivity>()
            val originalWeb = AtomicReference<WebView>()
            scenario.onActivity { activity ->
                originalActivity.set(activity)
                val web = requireNotNull(findWeb(activity.window.decorView))
                originalWeb.set(web)
                web.stopLoading()
                val source = activity.assets.open("browsing-position.js").bufferedReader().use { it.readText() }
                val ready = activity.assets.open("page-ready.js").bufferedReader().use { it.readText() }
                web.webViewClient = object : WebViewClient() {
                    override fun onPageFinished(view: WebView, url: String) {
                        view.evaluateJavascript("!!document.getElementById('nested') && !window.fixtureStarted") { loaded ->
                            if (loaded != "true") return@evaluateJavascript
                            view.evaluateJavascript(source + "\n" + """
                                (async()=>{
                                 try {
                                  window.fixtureStarted=true;window.fixtureToken='unchanged';window.fixtureHistory=history.length;
                                  const frames=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
                                  await frames();const ready=($ready);scrollTo(0,760);document.getElementById('nested').scrollTop=320;await frames();
                                  const checkpoint=window.__fproPosition.capture();
                                  scrollTo(0,0);document.getElementById('nested').scrollTop=0;
                                  const accepted=window.__fproPosition.restore(checkpoint);await frames();
                                  window.sessionFixture=JSON.stringify({ready,accepted,y:scrollY,nested:document.getElementById('nested').scrollTop});
                                 } catch(error) { window.sessionFixture=JSON.stringify({error:String(error)}); }
                                })()
                            """.trimIndent(), null)
                            fun probe(attempt: Int) {
                                view.evaluateJavascript("window.sessionFixture || null") { value ->
                                    if (value != "null") { result.set(value); done.countDown() }
                                    else if (attempt < 60) view.postDelayed({ probe(attempt + 1) }, 100)
                                }
                            }
                            view.postDelayed({ probe(0) }, 100)
                        }
                    }
                }
                web.loadDataWithBaseURL("https://fixture.invalid/position", """
                    <!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0">
                    <p style="position:fixed;top:0">Visible fixture header</p>
                    <section id="nested" style="height:200px;width:200px;overflow-y:auto"><div style="height:1800px">Nested fixture</div></section>
                    <div style="height:6000px"></div></body>
                """.trimIndent(), "text/html", "UTF-8", null)
            }
            assertTrue("Offline fixture must finish after native bootstrap", done.await(15, TimeUnit.SECONDS))
            val data = org.json.JSONObject(org.json.JSONArray("[${result.get()}]").getString(0))
            assertFalse("Fixture script error: $data", data.has("error"))
            assertTrue("Visible-content readiness: $data", data.getBoolean("ready")); assertTrue("Position restore accepted: $data", data.getBoolean("accepted"))
            assertEquals(760, data.getInt("y")); assertEquals(320, data.getInt("nested"))
            scenario.moveToState(Lifecycle.State.CREATED)
            scenario.moveToState(Lifecycle.State.RESUMED)
            val resumed = CountDownLatch(1)
            val same = AtomicReference("false")
            scenario.onActivity { activity ->
                requireNotNull(findWeb(activity.window.decorView)).evaluateJavascript("window.fixtureToken==='unchanged' && scrollY===760 && document.getElementById('nested').scrollTop===320") { value -> same.set(value); resumed.countDown() }
            }
            assertTrue(resumed.await(5, TimeUnit.SECONDS))
            assertEquals("Warm return must keep the live document, not reload it", "true", same.get())
            for (landscape in listOf(true, false)) {
                val rotated = CountDownLatch(1)
                val kept = AtomicReference("not settled")
                scenario.onActivity { activity ->
                    assertSame("Rotation must keep the Activity", originalActivity.get(), activity)
                    val view = requireNotNull(findWeb(activity.window.decorView))
                    assertSame("Rotation must keep the WebView", originalWeb.get(), view)
                    activity.requestedOrientation = if (landscape) android.content.pm.ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE else android.content.pm.ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
                    fun probe(attempt: Int) {
                        val expected = if (landscape) android.content.res.Configuration.ORIENTATION_LANDSCAPE else android.content.res.Configuration.ORIENTATION_PORTRAIT
                        if (activity.resources.configuration.orientation == expected && (if (landscape) view.width > view.height else view.height > view.width)) {
                            view.evaluateJavascript("window.fixtureToken==='unchanged' && Math.abs(scrollY-760)<3 && document.getElementById('nested').scrollTop===320 && history.length===window.fixtureHistory") { value ->
                                kept.set(value); rotated.countDown()
                            }
                        } else if (attempt < 80) view.postDelayed({ probe(attempt + 1) }, 100)
                    }
                    view.postDelayed({ probe(0) }, 400)
                }
                assertTrue("Actual orientation change must settle", rotated.await(12, TimeUnit.SECONDS))
                assertEquals("Rotation must preserve document, scroll and navigation history", "true", kept.get())
                scenario.onActivity { activity ->
                    assertSame("No Activity recreation after rotation", originalActivity.get(), activity)
                    assertSame(originalWeb.get(), findWeb(activity.window.decorView))
                }
            }

        }
    }
}
