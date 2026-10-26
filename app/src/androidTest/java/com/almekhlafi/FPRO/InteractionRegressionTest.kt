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

}
