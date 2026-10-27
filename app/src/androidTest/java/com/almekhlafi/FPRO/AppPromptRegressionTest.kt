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
                    web.webViewClient = object : WebViewClient() {
                        override fun onPageFinished(view: WebView, url: String?) {
                            view.evaluateJavascript("!!document.getElementById('prompt45') && !window.prompt45TestStarted") { ready ->
                                if (ready != "true") return@evaluateJavascript
                                view.evaluateJavascript("window.prompt45TestStarted=true;" + source + """
                                    ;(()=>{
                                      const shown=id=>{const el=document.getElementById(id);return getComputedStyle(el).display!=='none'&&el.getBoundingClientRect().height>0;};
                                      const cta=document.getElementById('inlineCTA');
                                      return JSON.stringify([
                                        getComputedStyle(cta).display==='none',
                                        shown('header')&&shown('slot')&&shown('search')&&shown('account'),
                                        shown('post')&&shown('video'),shown('modalCTA')&&shown('close'),
                                        shown('sheetCTA'),document.body.style.overflow==='hidden',
                                        !cta.hasAttribute('${if(reference) "data-fpro-hidden" else "data-fpro-reference-noapp"}'),
                                        document.querySelectorAll('body[data-fpro-hidden],main[data-fpro-hidden],header[data-fpro-hidden]').length===0
                                      ]);
                                    })()
                                """.trimIndent()) { value -> result.set(value); done.countDown() }
                            }
                        }
                    }
                    web.loadDataWithBaseURL("https://m.facebook.com/", """
                        <!doctype html><html><body id="prompt45" style="overflow:hidden">
                        <main><header id="header"><div id="slot"><button id="inlineCTA">فتح التطبيق</button></div>
                        <button id="search">Search</button><a id="account" href="/me">Account</a></header>
                        <article id="post"><video id="video" style="width:240px;height:180px"></video></article></main>
                        <div role="dialog" aria-modal="true" style="position:fixed;inset:0;background:black">
                        <button id="modalCTA">Open app</button><button id="close">Close</button></div>
                        <div style="position:fixed;inset:0;background:black"><button id="sheetCTA">Open app</button></div>
                        </body></html>
                    """.trimIndent(), "text/html", "UTF-8", null)
                }
                assertTrue("Real Chromium prompt fixture completed", done.await(15, TimeUnit.SECONDS))
                val checks = JSONArray(JSONArray("[${result.get()}]").getString(0))
                assertEquals(8, checks.length())
                for (i in 0 until checks.length()) assertTrue("reference=$reference assertion=$i result=$checks", checks.getBoolean(i))
            }
        }
    }
}
