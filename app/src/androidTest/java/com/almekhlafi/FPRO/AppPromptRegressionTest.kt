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
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith

/** Real Chromium layout for the black-backdrop regression, not account proof. */
@RunWith(AndroidJUnit4::class)
class AppPromptRegressionTest {
    private fun browser(view: View): WebView? {
        if (view is WebView) return view
        if (view is ViewGroup) for (i in 0 until view.childCount) browser(view.getChildAt(i))?.let { return it }
        return null
    }
    @Test fun openAppFilterKeepsBlockingSheetsAndPageControlsUsable() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        for (reference in listOf(false, true)) {
            ActivityScenario.launch<MainActivity>(Intent(context, MainActivity::class.java)).use { scenario ->
                awaitBrowserReady(scenario)
                val done = CountDownLatch(1)
                val result = AtomicReference("null")
                scenario.onActivity { activity ->
                    val web = requireNotNull(browser(activity.window.decorView))
                    web.stopLoading()
                    val config = """{"enhance":true,"appBanner":true,"referenceEngine":$reference,"color":"طبيعي","textSelection":false}"""
                    val source = activity.assets.open("reference-engines.js").bufferedReader().use { it.readText() } + "\n" +
                        activity.assets.open("facebook.js").bufferedReader().use { it.readText() }.replace("__CONFIG__", config)
                    val fixtureUrl = "https://m.facebook.com/fpro-app-prompt45-test"
                    // Stock API29 Chromium predates CSS inset; use real fullscreen longhands.
                    val fixtureHtml = """
                        <!doctype html><html><body id="prompt45" style="overflow:hidden">
                        <main><header id="header"><div id="slot"><button id="inlineCTA">فتح التطبيق</button></div>
                        <button id="search">Search</button><a id="account" href="/me">Account</a></header>
                        <article id="post"><video id="video" style="width:240px;height:180px"></video></article></main>
                        <div role="dialog" aria-modal="true" style="position:fixed;top:0;bottom:0;left:0;right:0;background:black">
                        <button id="modalCTA">Open app</button><button id="close">Close</button></div>
                        <div style="position:fixed;top:0;bottom:0;left:0;right:0;background:black"><button id="sheetCTA">Open app</button></div>
                        <header id="reelNav" style="position:fixed;top:0;left:0;width:100%;height:72px;background:black">
                        <button id="reelCTA"><svg><title>Facebook logo</title></svg><span>فتح</span><span>التطبيق</span></button><button id="reelSearch" aria-label="Search"></button><a id="reelAccount" href="/me" aria-label="Your profile">Account</a><span>ريلز</span></header>
                        <div id="compactBar" style="position:fixed;bottom:0;left:0;width:100%;min-height:64px;background:black;display:flex!important">
                        <button id="compactCTA">فتح التطبيق</button><button aria-label="Close">×</button></div>
                        </body></html>
                    """.trimIndent()
                    web.webViewClient = object : WebViewClient() {
                        override fun shouldInterceptRequest(view: WebView, request: android.webkit.WebResourceRequest): android.webkit.WebResourceResponse? {
                            if (request.url.toString() != fixtureUrl) return null
                            return android.webkit.WebResourceResponse("text/html", "UTF-8", fixtureHtml.byteInputStream())
                        }
                        override fun onPageFinished(view: WebView, url: String?) {
                            if (url != fixtureUrl) return
                            view.evaluateJavascript("!!document.getElementById('prompt45') && !window.prompt45TestStarted") { ready ->
                                if (ready != "true") return@evaluateJavascript
                                view.evaluateJavascript("window.prompt45TestStarted=true;" + source + """
                                    ;(()=>{
                                      const shown=id=>{const el=document.getElementById(id);return getComputedStyle(el).display!=='none'&&el.getBoundingClientRect().height>0;};
                                      const cta=document.getElementById('inlineCTA');
                                      const checks=[
                                        getComputedStyle(cta).display==='none',
                                        shown('header')&&getComputedStyle(document.getElementById('slot')).display!=='none'&&shown('search')&&shown('account'),
                                        shown('post')&&shown('video'),shown('modalCTA')&&shown('close'),
                                        shown('sheetCTA'),document.body.style.overflow==='hidden',
                                        !cta.hasAttribute('${if(reference) "data-fpro-hidden" else "data-fpro-reference-noapp"}'),
                                        document.querySelectorAll('body[data-fpro-hidden],main[data-fpro-hidden],header[data-fpro-hidden]').length===0
                                      ];
                                      checks.push(getComputedStyle(document.getElementById('reelCTA')).display==='none');
                                      checks.push(shown('reelNav')&&shown('reelSearch')&&shown('reelAccount'));
                                      const reel=document.getElementById('reelCTA');
                                      reel.style.setProperty('display','inline-flex','');
                                      checks.push(getComputedStyle(reel).display==='none'); // before observer/RAF: owned CSS wins
                                      const bar=document.getElementById('compactBar');
                                      checks.push(getComputedStyle(bar).display==='none');
                                      checks.push(getComputedStyle(document.getElementById('compactCTA')).display!=='none');
                                      window.__fpro.update(Object.assign($config,{appBanner:false}));
                                      checks.push(getComputedStyle(bar).display==='flex'&&bar.style.getPropertyPriority('display')==='important'&&shown('compactCTA'));
                                      checks.push(shown('reelCTA')&&!reel.hasAttribute('data-fpro-app-prompt')&&!reel.hasAttribute('data-fpro-reference-noapp'));
                                      return JSON.stringify(checks);
                                    })()
                                """.trimIndent()) { value -> result.set(value); done.countDown() }
                            }
                        }
                    }
                    web.loadUrl(fixtureUrl)
                }
                assertTrue("Real Chromium prompt fixture completed", done.await(15, TimeUnit.SECONDS))
                val checks = JSONArray(JSONArray("[${result.get()}]").getString(0))
                assertEquals(15, checks.length())
                for (i in 0 until checks.length()) assertTrue("reference=$reference assertion=$i result=$checks", checks.getBoolean(i))
            }
        }
    }
}
