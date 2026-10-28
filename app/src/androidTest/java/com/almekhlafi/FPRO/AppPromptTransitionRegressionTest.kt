package com.almekhlafi.FPRO

import android.content.Intent
import android.os.SystemClock
import android.view.MotionEvent
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

/** Trusted Android touch + real Chromium frames; not the owner's private DOM. */
@RunWith(AndroidJUnit4::class)
class AppPromptTransitionRegressionTest {
    private fun browser(view: View): WebView? {
        if (view is WebView) return view
        if (view is ViewGroup) for (i in 0 until view.childCount) browser(view.getChildAt(i))?.let { return it }
        return null
    }
    @Test fun trustedActionsKeepVerifiedFooterHiddenDuringFixedPageTransitions() {
        assertTrue("This investigation must use the debuggable build", BuildConfig.DEBUG)
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        for (reference in listOf(false, true)) {
            ActivityScenario.launch<MainActivity>(Intent(context, MainActivity::class.java)).use { scenario ->
                awaitBrowserReady(scenario)
                val ready = CountDownLatch(1)
                val config = """{"enhance":true,"appBanner":true,"referenceEngine":$reference,"color":"طبيعي","textSelection":false}"""
                scenario.onActivity { activity ->
                    val web = requireNotNull(browser(activity.window.decorView))
                    web.stopLoading()
                    val source = activity.assets.open("reference-engines.js").bufferedReader().use { it.readText() } + "\n" +
                        activity.assets.open("facebook.js").bufferedReader().use { it.readText() }.replace("__CONFIG__", config)
                    val url = "https://m.facebook.com/fpro-transition56-fixture"
                    val html = """
                        <!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
                        <style>body{margin:0}#page{position:relative;width:100vw;height:100vh;background:#eee}#tools button{width:76px;height:48px}#footer{position:fixed;bottom:0;left:0;width:100%;height:65px;background:teal}#footer button{height:40px}</style></head>
                        <body><div id="page" role="main"><div id="tools" role="toolbar"><button>Like</button><button>Comments</button><button>Profile</button><button>Menu</button></div>
                        <video id="clip" style="width:160px;height:90px"></video><p>Independent page content</p>
                        <div id="footer"><button>فتح التطبيق</button></div></div></body></html>
                    """.trimIndent()
                    web.webViewClient = object : WebViewClient() {
                        override fun shouldInterceptRequest(view: WebView, request: android.webkit.WebResourceRequest): android.webkit.WebResourceResponse? =
                            if (request.url.toString() == url) android.webkit.WebResourceResponse("text/html", "UTF-8", html.byteInputStream()) else null
                        override fun onPageFinished(view: WebView, finished: String?) {
                            if (finished != url) return
                            view.evaluateJavascript("!!window.transition56Started") { started ->
                                if (started == "true") return@evaluateJavascript
                                view.evaluateJavascript("window.transition56Started=true;" + source + """
                                    ;(()=>{
                                      const page=document.getElementById('page'),footer=document.getElementById('footer');
                                      window.transition56Done=null;
                                      document.querySelectorAll('#tools button').forEach((button,index)=>button.addEventListener('click',e=>{
                                        window.transition56Done=null;page.style.position='fixed';page.style.top='0';page.style.left='0';page.style.opacity='.65';
                                        let samples=0,exposed=0;
                                        function sample(){
                                          samples++;if(getComputedStyle(footer).display!=='none'&&footer.getBoundingClientRect().height>0)exposed++;
                                          if(samples<12){requestAnimationFrame(sample);return;}
                                          const visible=id=>getComputedStyle(document.getElementById(id)).display!=='none';
                                          const record={index,trusted:e.isTrusted,samples,exposed,page:visible('page'),tools:visible('tools'),video:visible('clip'),child:getComputedStyle(footer.firstChild).display!=='none',reference:$reference};
                                          page.style.position='relative';page.style.opacity='1';window.transition56Done=record;
                                        }
                                        requestAnimationFrame(sample);
                                      }));
                                    })();
                                """.trimIndent()) { ready.countDown() }
                            }
                        }
                    }
                    web.loadUrl(url)
                }
                assertTrue("Fixture boot completed", ready.await(15, TimeUnit.SECONDS))
                for (index in 0..3) {
                    val done = CountDownLatch(1)
                    val result = AtomicReference("null")
                    scenario.onActivity { activity ->
                        val web = requireNotNull(browser(activity.window.decorView))
                        web.evaluateJavascript("(()=>{window.transition56Done=null;const r=document.querySelectorAll('#tools button')[$index].getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2,innerWidth]})()") { value ->
                            val point = JSONArray(value)
                            val scale = web.width.toFloat() / point.getDouble(2).toFloat()
                            val x = point.getDouble(0).toFloat() * scale
                            val y = point.getDouble(1).toFloat() * scale
                            val down = SystemClock.uptimeMillis()
                            fun send(action: Int) {
                                val event = MotionEvent.obtain(down, SystemClock.uptimeMillis(), action, x, y, 0)
                                web.dispatchTouchEvent(event); event.recycle()
                            }
                            send(MotionEvent.ACTION_DOWN)
                            web.postDelayed({ send(MotionEvent.ACTION_UP) }, 60)
                            val deadline = SystemClock.uptimeMillis() + 5000
                            val poll = object : Runnable {
                                override fun run() {
                                    web.evaluateJavascript("window.transition56Done") { encoded ->
                                        if (encoded != "null") { result.set(encoded); done.countDown() }
                                        else if (SystemClock.uptimeMillis() < deadline) web.postDelayed(this, 50)
                                        else done.countDown()
                                    }
                                }
                            }
                            web.postDelayed(poll, 100)
                        }
                    }
                    assertTrue("Trusted action completed", done.await(6, TimeUnit.SECONDS))
                    assertNotEquals("Trusted click produced a report", "null", result.get())
                    val report = JSONObject(result.get())
                    assertTrue("Must use trusted native input, not synthetic site events", report.getBoolean("trusted"))
                    assertEquals(index, report.getInt("index"))
                    assertEquals("Verified footer exposed during fixed page transition: $report", 0, report.getInt("exposed"))
                    assertEquals(12, report.getInt("samples"))
                    for (key in listOf("page", "tools", "video", "child")) assertTrue("Preserve $key: $report", report.getBoolean(key))
                }
            }
        }
    }
}
