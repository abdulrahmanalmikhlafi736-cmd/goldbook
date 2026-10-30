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
class SiteReplacementRegressionTest {
    private fun browser(view: View): WebView? {
        if (view is WebView) return view
        if (view is ViewGroup) for (i in 0 until view.childCount) browser(view.getChildAt(i))?.let { return it }
        return null
    }
    @Test fun importedEngineReplacesLegacySelectorsAndRestoresNativeLayout() {
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
                        put("siteEngine", "upstream"); put("enhance", true); put("referenceEngine", true); put("appBanner", true)
                        put("textSelection", false); put("color", "تلقائي"); put("dynamic", true)
                        put("systemAccent", nativeConfig.optString("systemAccent", "#135724"))
                        for (key in listOf("ads", "people", "groups", "suggested", "stories", "reels", "amoled", "sticky")) put(key, true)
                    }.toString()
                    val source = activity.assets.open("site-engine.js").bufferedReader().use { it.readText() } + "\n" + activity.assets.open("reference-engines.js").bufferedReader().use { it.readText() } + "\n" + activity.assets.open("facebook.js").bufferedReader().use { it.readText() }.replace("__CONFIG__", config)
                    val web = requireNotNull(browser(activity.window.decorView)); web.stopLoading()
                    val url = "https://m.facebook.com/"
                    val html = """<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}.blue{color:#1877f2}</style></head><body id="adapt57">
                    <main>Protected page</main><article id="ordinary"><span>Suggested for you</span></article>
                    <div id="ad" data-dcm-id="1" data-mcomponent="MContainer"><div class="native-text rslh"><span class="f5" style="color:#8a8d91">Sponsored</span></div></div>
                    <div id="gap"></div><div id="suggested" data-tracking-duration-id="1"><div data-mcomponent="TextArea" data-type="text" data-tti-phase="-1"><div class="native-text"><span>•</span></div></div></div>
                    <div id="people" data-tracking-duration-id="2"><div class="hscroller">People</div></div>
                    <div id="stories" data-mcomponent="MContainer" data-srat="43">Story</div><div id="reels" data-tracking-duration-id="4"><div class="fl ac"><span class="native-text">󰣝</span></div></div>
                    <div id="surface" style="background-color:rgba(36,37,38,1.0);">Dark surface</div><div id="photo" style="background-image:linear-gradient(red,blue)">Image</div><button id="color" style="color:rgb(24,119,242);">Action</button>
                    <div id="nav" class="m" data-mcomponent="MContainer" data-focusable="true" data-type="container" data-tti-phase="-1" style="height:48px"><div aria-label="Facebook"></div><button id="search">Search</button></div><div id="tabs" class="m" data-mcomponent="MContainer" role="tablist" data-tti-phase="-1" data-type="container" style="height:40px"><div aria-label="feed"></div></div>
                    <div data-type="vscroller" data-is-pull-to-refresh-allowed="true"><div id="content">Content</div></div>
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
                                  const checks=['ad','people','gap','suggested','stories','reels'].map(hidden);
                                  checks.push(!hidden('ordinary')&&getComputedStyle(document.querySelector('main')).display!=='none');
                                  checks.push(getComputedStyle(el('surface')).backgroundColor==='rgb(0, 0, 0)');
                                  checks.push(getComputedStyle(el('photo')).backgroundImage.includes('gradient'));
                                  const hex=($config).systemAccent,n=parseInt(hex.slice(1),16),rgb='rgb('+[(n>>16)&255,(n>>8)&255,n&255].join(', ')+')';
                                  checks.push(getComputedStyle(el('color')).color===rgb);
                                  checks.push(getComputedStyle(el('nav')).position==='fixed'&&getComputedStyle(el('tabs')).top==='48px'&&getComputedStyle(el('content')).marginTop==='88px');
                                  window.__fpro.update({enhance:false});
                                  checks.push(['ad','people','gap','suggested','stories','reels'].every(id=>!hidden(id)));
                                  checks.push(getComputedStyle(el('surface')).backgroundColor==='rgb(36, 37, 38)');
                                  checks.push(el('nav').style.position===''&&el('content').style.marginTop===''&&document.body.style.overflow==='');
                                  checks.push(getComputedStyle(el('color')).color==='rgb(24, 119, 242)');
                                  checks.push(window.FproSiteEngine.report().errors.length===0);
                                  checks.push(window.__fpro.colorReport().referenceEngine===false);
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
                assertEquals(17, checks.length())
                for (i in 0 until checks.length()) assertTrue("adaptation check=$i results=$checks", checks.getBoolean(i))
            }
        } finally { preferences.set("dynamic", oldDynamic) }
    }
}
