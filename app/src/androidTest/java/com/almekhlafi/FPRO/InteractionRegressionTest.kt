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

/** Real OS input into WebView; the fixture delegates reactions like the site.
 * This is not a claim of authenticated Facebook or physical-device coverage. */
@RunWith(AndroidJUnit4::class)
class InteractionRegressionTest {
    private fun findWeb(view: View): WebView? {
        if (view is WebView) return view
        if (view is ViewGroup) for (i in 0 until view.childCount) findWeb(view.getChildAt(i))?.let { return it }
        return null
    }

    @Test fun realTapAndHeldReactionSurviveFeedChurn() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val automation = instrumentation.getUiAutomation(0)
        ActivityScenario.launch<MainActivity>(android.content.Intent().setClassName(instrumentation.targetContext.packageName, "com.almekhlafi.FPRO.MainActivity")).use { scenario ->
            Thread.sleep(2300)
            val ready = CountDownLatch(1)
            scenario.onActivity { activity ->
                val web = requireNotNull(findWeb(activity.window.decorView))
                web.stopLoading()
                web.loadDataWithBaseURL("https://fixture.invalid/", """
                    <html><meta name="viewport" content="width=device-width,initial-scale=1">
                    <style>body{margin:20px;font:20px sans-serif}#reaction{position:fixed;bottom:100px;left:30px;width:250px;height:70px;background:#ddd;touch-action:manipulation;user-select:none}#feed{height:180px;overflow:hidden}#palette{position:fixed;bottom:190px;left:20px;background:white}</style>
                    <body><article role="button"><p id="reading">Like minded people still need native text selection.</p><div id="feed"></div><div id="reaction" role="button" aria-label="Like this post, 12 reactions"><span>إعجاب · 12</span></div></article><div id="palette" role="menu" hidden>👍 ❤️ 😆 😮 😢 😡</div>
                    <script>
                    window.likes=0;window.reactions=0;window.churn=0;window.scansAtDown=-1;window.scansDuringHold=-1;
                    let timer=null,held=false;
                    document.addEventListener('pointerdown',function(e){
                      if(!e.target.closest('#reaction'))return;
                      held=false;window.scansAtDown=window.__fpro.colorReport().work.scans;
                      timer=setTimeout(function(){held=true;window.reactions++;document.querySelector('#palette').hidden=false;window.scansDuringHold=window.__fpro.colorReport().work.scans;},650);
                    },true);
                    document.addEventListener('pointerup',function(){clearTimeout(timer);},true);
                    document.addEventListener('pointercancel',function(){clearTimeout(timer);},true);
                    document.addEventListener('contextmenu',function(e){e.preventDefault();},true);
                    document.addEventListener('click',function(e){if(e.target.closest('#reaction')){if(!held)window.likes++;held=false;}},true);
                    setInterval(function(){const feed=document.querySelector('#feed'),p=document.createElement('p');p.textContent='#feed'+(++window.churn);p.style.color='rgb(24,119,242)';feed.appendChild(p);while(feed.childElementCount>20)feed.firstChild.remove();},40);
                    </script></body></html>
                """.trimIndent(), "text/html", "UTF-8", null)
                fun probe(attempt: Int) {
                    web.evaluateJavascript("!!document.querySelector('#reaction') && document.readyState==='complete'") { result ->
                        if (result == "true") {
                            val engines = activity.assets.open("reference-engines.js").bufferedReader().use { it.readText() }
                            val source = activity.assets.open("facebook.js").bufferedReader().use { it.readText() }.replace("__CONFIG__", "{\"enhance\":true,\"referenceEngine\":true,\"color\":\"أخضر\",\"textSelection\":true}")
                            web.evaluateJavascript(engines) { web.evaluateJavascript(source) {
                                web.postVisualStateCallback(41, object : WebView.VisualStateCallback() { override fun onComplete(requestId: Long) { ready.countDown() } })
                            } }
                        } else if (attempt < 30) web.postDelayed({ probe(attempt+1) },200)
                    }
                }
                web.postDelayed({ probe(0) },200)
            }
            assertTrue("Reaction fixture and production scripts must render",ready.await(12,TimeUnit.SECONDS))
            fun evaluate(js: String): String {
                val latch=CountDownLatch(1);val value=AtomicReference("")
                scenario.onActivity { activity -> requireNotNull(findWeb(activity.window.decorView)).evaluateJavascript(js) { value.set(it);latch.countDown() } }
                assertTrue("WebView must remain responsive",latch.await(5,TimeUnit.SECONDS))
                return value.get()
            }
            val point=FloatArray(2);val measured=CountDownLatch(1)
            scenario.onActivity { activity ->
                val web=requireNotNull(findWeb(activity.window.decorView))
                web.evaluateJavascript("JSON.stringify((function(){var r=document.querySelector('#reaction span').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,w:innerWidth};})())") { result ->
                    val data=org.json.JSONObject(org.json.JSONArray("[$result]").getString(0));val offset=IntArray(2);web.getLocationOnScreen(offset);val scale=web.width/data.getDouble("w")
                    point[0]=(offset[0]+data.getDouble("x")*scale).toFloat();point[1]=(offset[1]+data.getDouble("y")*scale).toFloat();measured.countDown()
                }
            }
            assertTrue(measured.await(5,TimeUnit.SECONDS))
            fun press(duration: Long) {
                val down=android.os.SystemClock.uptimeMillis()
                val start=android.view.MotionEvent.obtain(down,down,android.view.MotionEvent.ACTION_DOWN,point[0],point[1],0)
                start.source=android.view.InputDevice.SOURCE_TOUCHSCREEN
                assertTrue(automation.injectInputEvent(start,true));start.recycle()
                Thread.sleep(duration)
                val end=android.view.MotionEvent.obtain(down,android.os.SystemClock.uptimeMillis(),android.view.MotionEvent.ACTION_UP,point[0],point[1],0)
                end.source=android.view.InputDevice.SOURCE_TOUCHSCREEN
                automation.injectInputEvent(end,false);end.recycle()
                Thread.sleep(180)
            }
            press(80)
            assertEquals("Ordinary tap still applies Like", "1",evaluate("window.likes"))
            Thread.sleep(400)
            val churnBefore=evaluate("window.churn").toInt()
            press(1000)
            assertEquals("Real long press must reach the delegated reaction handler", "1",evaluate("window.reactions"))
            assertEquals("Long press opens the reaction palette", "false",evaluate("document.querySelector('#palette').hidden"))
            assertEquals("Long press must not also apply a normal Like", "1",evaluate("window.likes"))
            assertTrue("Fixture mutations continued during OS hold",evaluate("window.churn").toInt()>churnBefore+5)
            assertEquals("Full recoloring must not run during a held reaction gesture", "true",evaluate("window.scansAtDown===window.scansDuringHold"))
        }
    }
    @Test fun nativePullReloadsOnceDespiteBlockedSiteDownAndKeepsStorage() {
        val instrumentation=InstrumentationRegistry.getInstrumentation()
        val automation=instrumentation.getUiAutomation(0)
        val requests=java.util.concurrent.atomic.AtomicInteger(0)
        ActivityScenario.launch<MainActivity>(android.content.Intent().setClassName(instrumentation.targetContext.packageName,"com.almekhlafi.FPRO.MainActivity")).use { scenario ->
            Thread.sleep(2300)
            val ready=CountDownLatch(1)
            scenario.onActivity { activity ->
                val web=requireNotNull(findWeb(activity.window.decorView));web.stopLoading()
                val delegate=web.webViewClient
                web.webViewClient=object: android.webkit.WebViewClient() {
                    override fun onPageStarted(view: WebView,url: String?,favicon: android.graphics.Bitmap?) { delegate.onPageStarted(view,url,favicon) }
                    override fun onPageFinished(view: WebView,url: String?) { delegate.onPageFinished(view,url) }
                    override fun shouldInterceptRequest(view: WebView,request: android.webkit.WebResourceRequest): android.webkit.WebResourceResponse? {
                        if(request.url.path!="/fpro-native-pull-fixture") return delegate.shouldInterceptRequest(view,request)
                        val count=if(request.isForMainFrame)requests.incrementAndGet() else requests.get()
                        val html="""<html><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:20px;font:24px sans-serif}p{line-height:48px;user-select:none}</style><body><article role="button"><p id="pull">FPRO native pull text paragraph starts here. Selection remains native while dragging downward deliberately refreshes.</p><div style="height:2000px">Other feed content</div></article><script>window.fixtureNavigation=$count;window.siteDown=0;document.addEventListener('pointerdown',function(){window.siteDown++;},true);</script></body></html>"""
                        return android.webkit.WebResourceResponse("text/html","UTF-8",html.byteInputStream())
                    }
                }
                web.loadUrl("https://m.facebook.com/fpro-native-pull-fixture?case=42")
                fun probe(attempt: Int) {
                    web.evaluateJavascript("!!document.querySelector('#pull') && !!window.__fpro && document.readyState==='complete'") { result ->
                        if(result=="true") {
                            // Disable paint/filter work, NOT native selection: isolate the
                            // swallowed site pointerdown defect from performance changes.
                            web.evaluateJavascript("window.__fpro.update({enhance:false,textSelection:true});document.cookie='fproPullSentinel=retained;path=/';localStorage.setItem('fproPullSentinel','retained');") {
                                web.postVisualStateCallback(42,object: WebView.VisualStateCallback(){override fun onComplete(requestId: Long){ready.countDown()}})
                            }
                        } else if(attempt<40)web.postDelayed({probe(attempt+1)},200)
                    }
                }
                web.postDelayed({probe(0)},200)
            }
            assertTrue("Real host/selection fixture must load",ready.await(15,TimeUnit.SECONDS));Thread.sleep(800)
            fun evaluate(script: String): String {
                val latch=CountDownLatch(1);val out=AtomicReference("")
                scenario.onActivity { activity ->requireNotNull(findWeb(activity.window.decorView)).evaluateJavascript(script){out.set(it);latch.countDown()} }
                assertTrue(latch.await(5,TimeUnit.SECONDS));return out.get()
            }
            val point=FloatArray(3);val measured=CountDownLatch(1)
            scenario.onActivity { activity ->
                val web=requireNotNull(findWeb(activity.window.decorView))
                web.evaluateJavascript("JSON.stringify((function(){var r=document.querySelector('#pull').getBoundingClientRect();return {x:r.left+30,y:r.top+20,w:innerWidth};})())") { result ->
                    val data=org.json.JSONObject(org.json.JSONArray("[$result]").getString(0));val offset=IntArray(2);web.getLocationOnScreen(offset);val scale=web.width/data.getDouble("w")
                    point[0]=(offset[0]+data.getDouble("x")*scale).toFloat();point[1]=(offset[1]+data.getDouble("y")*scale).toFloat();point[2]=web.resources.displayMetrics.density;measured.countDown()
                }
            }
            assertTrue(measured.await(5,TimeUnit.SECONDS))
            fun drag(dp: Float) {
                val down=android.os.SystemClock.uptimeMillis()
                fun input(action: Int,dy: Float) {
                    val event=android.view.MotionEvent.obtain(down,android.os.SystemClock.uptimeMillis(),action,point[0],point[1]+dy,0);event.source=android.view.InputDevice.SOURCE_TOUCHSCREEN
                    assertTrue(automation.injectInputEvent(event,true));event.recycle()
                }
                input(android.view.MotionEvent.ACTION_DOWN,0f);Thread.sleep(160)
                for(step in 1..8){input(android.view.MotionEvent.ACTION_MOVE,dp*point[2]*step/8);Thread.sleep(20)}
                input(android.view.MotionEvent.ACTION_UP,dp*point[2]);Thread.sleep(250)
            }
            drag(45f)
            assertEquals("Short ordinary scroll must not reload",1,requests.get())
            assertEquals("Selection guard still blocks the site's delegated reading pointerdown","0",evaluate("window.siteDown"))
            evaluate("getSelection().removeAllRanges()")
            drag(160f)
            repeat(25){if(requests.get()<2)Thread.sleep(100)}
            assertEquals("Deliberate downward pull must cause exactly one real native reload",2,requests.get())
            Thread.sleep(700)
            assertEquals("Refreshed document must be the real second response","2",evaluate("window.fixtureNavigation"))
            assertEquals("No cookie/cache/storage clearing to disguise a freeze","true",evaluate("document.cookie.indexOf('fproPullSentinel=retained')>=0 && localStorage.getItem('fproPullSentinel')==='retained'"))
            assertEquals("No automatic refresh loop",2,requests.get())
        }
    }

}
