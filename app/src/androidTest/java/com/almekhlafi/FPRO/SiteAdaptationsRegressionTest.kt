package com.almekhlafi.FPRO

import android.content.Intent
import android.view.View
import android.view.ViewGroup
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicReference
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class SiteAdaptationsRegressionTest {
    private fun browser(view: View): WebView? {
        if (view is WebView) return view
        if (view is ViewGroup) for (i in 0 until view.childCount) browser(view.getChildAt(i))?.let { return it }
        return null
    }
    @Test fun adaptedFiltersUseNativeMaterialPaletteAndRestoreSiteContent() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val preferences = Preferences(context)
        val oldDynamic = preferences.flag("dynamic")
        try {
            preferences.set("dynamic", true)
            ActivityScenario.launch<MainActivity>(Intent(context, MainActivity::class.java)).use { scenario ->
                awaitBrowserReady(scenario)
                val done = CountDownLatch(1)
                val result = AtomicReference("null")
                scenario.onActivity { activity ->
                    val nativeConfig = JSONObject(MainActivity::class.java.getDeclaredMethod("pageScriptConfig").apply { isAccessible = true }.invoke(activity) as String)
                    if (android.os.Build.VERSION.SDK_INT >= 31) assertTrue("Real native MaterialYou palette serialized", nativeConfig.getString("systemAccent").matches(Regex("#[0-9a-fA-F]{6}")))
                    val config = JSONObject().apply {
                        put("enhance", true); put("referenceEngine", true); put("appBanner", true)
                        put("textSelection", false); put("color", "تلقائي"); put("dynamic", true)
                        put("systemAccent", nativeConfig.optString("systemAccent", "#135724"))
                        for (key in listOf("ads", "people", "groups", "suggested", "stories", "reels", "amoled", "sticky")) put(key, true)
                    }.toString()
                    val source = activity.assets.open("reference-engines.js").bufferedReader().use { it.readText() } + "\n" + activity.assets.open("facebook.js").bufferedReader().use { it.readText() }.replace("__CONFIG__", config)
                    val web = requireNotNull(browser(activity.window.decorView)); web.stopLoading()
                    val url = "https://m.facebook.com/"
                    val html = """<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}.blue{color:#1877f2}</style></head><body id="adapt57">
                    <main>Protected page</main><div id="ad" class="sponsored_ad">Ad unit</div><div id="ordinary">Ordinary post •</div>
                    <div id="people" data-tracking-duration-id="1"><h3>People you may know</h3></div><div id="groups" data-tracking-duration-id="2"><h3>Suggested groups</h3></div><div id="suggested" data-tracking-duration-id="3"><h3>Suggested for you</h3></div>
                    <div id="stories" data-mcomponent="MContainer" data-srat="43"><a href="/stories/123">Story</a></div><div id="reels" data-tracking-duration-id="4"><div class="fl ac"><span class="native-text">󰣝</span></div><a href="/reel/42">Reel</a></div>
                    <div id="surface" data-mcomponent="MContainer" style="background-color:rgb(36,37,38)">Dark surface</div><div id="photo" data-mcomponent="MContainer" style="background-color:rgb(36,37,38);background-image:linear-gradient(red,blue)">Image</div><button id="color" class="blue">Action</button>
                    <div id="nav" data-mcomponent="MContainer" data-focusable="true" data-type="container" data-tti-phase="-1" style="height:48px"><div aria-label="Facebook"></div><button aria-label="Search">Search</button></div><div id="tabs" data-mcomponent="MContainer" role="tablist"><button aria-label="feed">Feed</button></div>
                    </body></html>""".trimIndent()
                    web.webViewClient = object : WebViewClient() {
                        override fun shouldInterceptRequest(view: WebView, request: android.webkit.WebResourceRequest): android.webkit.WebResourceResponse? = if (request.url.toString() == url) android.webkit.WebResourceResponse("text/html", "UTF-8", html.byteInputStream()) else null
                        override fun onPageFinished(view: WebView, finished: String?) {
                            if (finished != url) return
                            view.evaluateJavascript("!!document.getElementById('adapt57') && !window.adapt57Started") { ready ->
                                if (ready != "true") return@evaluateJavascript
                                view.evaluateJavascript("window.adapt57Started=true;" + source + """
                                ;(()=>{
                                  const el=id=>document.getElementById(id),hidden=id=>getComputedStyle(el(id)).display==='none';
                                  const checks=['ad','people','groups','suggested','stories','reels'].map(hidden);
                                  checks.push(!hidden('ordinary')&&getComputedStyle(document.querySelector('main')).display!=='none');
                                  checks.push(getComputedStyle(el('surface')).backgroundColor==='rgb(0, 0, 0)');
                                  checks.push(getComputedStyle(el('photo')).backgroundImage.includes('gradient'));
                                  const hex=($config).systemAccent,n=parseInt(hex.slice(1),16),rgb='rgb('+[(n>>16)&255,(n>>8)&255,n&255].join(', ')+')';
                                  checks.push(getComputedStyle(el('color')).color===rgb);
                                  checks.push(getComputedStyle(el('nav')).position==='sticky'&&getComputedStyle(el('tabs')).top==='48px');
                                  window.__fpro.update({enhance:false});
                                  checks.push(['ad','people','groups','suggested','stories','reels'].every(id=>!hidden(id)));
                                  checks.push(getComputedStyle(el('surface')).backgroundColor==='rgb(36, 37, 38)');
                                  checks.push(!document.querySelector('[data-fpro-adapt-sticky]')&&el('tabs').style.getPropertyValue('--fpro-nav-offset')==='');
                                  checks.push(getComputedStyle(el('color')).color==='rgb(24, 119, 242)');
                                  return JSON.stringify(checks);
                                })();
                                """.trimIndent()) { encoded -> result.set(encoded); done.countDown() }
                            }
                        }
                    }
                    web.loadUrl(url)
                }
                assertTrue("Native adaptations fixture completed", done.await(15, TimeUnit.SECONDS))
                assertNotEquals("Fixture result", "null", result.get())
                val checks = JSONArray(JSONArray("[${result.get()}]").getString(0))
                assertEquals(15, checks.length())
                for (i in 0 until checks.length()) assertTrue("adaptation check=$i results=$checks", checks.getBoolean(i))
            }
        } finally { preferences.set("dynamic", oldDynamic) }
    }
}
