package com.almekhlafi.FPRO

import android.graphics.Color
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

@RunWith(AndroidJUnit4::class)
class PromptSelection59RegressionTest {
    private fun findWeb(view: View): WebView? {
        if (view is WebView) return view
        if (view is ViewGroup) for (i in 0 until view.childCount) findWeb(view.getChildAt(i))?.let { return it }
        return null
    }

    @Test fun productionPromptRulesHideBeforeFirstFrameAndRestoreOff() {
        val context=InstrumentationRegistry.getInstrumentation().targetContext
        val store=context.getSharedPreferences("fpro",android.content.Context.MODE_PRIVATE)
        val keys=listOf("pageEnhancements","appBanner","textSelection","color","dark","amoled")
        val previous=store.all.filterKeys { it in keys }
        store.edit().putBoolean("pageEnhancements",true).putBoolean("appBanner",true).putBoolean("textSelection",true).putString("color","طبيعي").putBoolean("dark",false).putBoolean("amoled",false).commit()
        try { ActivityScenario.launch<MainActivity>(android.content.Intent(context,MainActivity::class.java)).use { scenario ->
            awaitBrowserReady(scenario)
            val done=CountDownLatch(1);val result=java.util.concurrent.atomic.AtomicReference("null")
            scenario.onActivity { activity ->
                val web=requireNotNull(findWeb(activity.window.decorView));web.stopLoading()
                val html="""<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}#bar{position:fixed;bottom:0;width:100%;height:64px;background:#222}</style><script>
                requestAnimationFrame(()=>{
                  const hidden=id=>{const e=document.getElementById(id);return !!e&&(!e.getClientRects().length||getComputedStyle(e).display==='none')};
                  window.first59={early:window.__fproEarly===true,plain:hidden('plain'),bar:hidden('bar'),wrapped:hidden('wrapped'),search:!hidden('search'),account:!hidden('account'),input:!hidden('password'),main:!hidden('main')};
                  let n=0;function sample(){if(n++<12){document.getElementById('bar').style.setProperty('display','block','important');requestAnimationFrame(()=>{window.exposed59=(window.exposed59||0)+(hidden('bar')?0:1);sample();});}else window.finished59=true;}sample();
                });</script></head><body><button id="plain">فتح التطبيق</button><main id="main" style="position:fixed;inset:0"><button id="search" aria-label="Search">Search</button><button id="account">Account</button><button id="wrapped">Open app</button><article><p>Protected post</p></article></main><form><input id="password" type="password"><button>Open app</button></form><div id="bar" class="bottom fixed-container" data-actual-height="64"><button aria-label="فتح التطبيق">فتح التطبيق</button></div></body></html>"""
                val url="https://m.facebook.com/"
                web.webViewClient=object:android.webkit.WebViewClient(){
                    override fun shouldInterceptRequest(view:WebView,request:android.webkit.WebResourceRequest):android.webkit.WebResourceResponse?=if(request.url.toString()==url)android.webkit.WebResourceResponse("text/html","UTF-8",html.byteInputStream())else null
                }
                web.loadUrl(url)
                fun probe(attempt:Int){web.evaluateJavascript("""(()=>{if(!window.finished59)return null;const first=window.first59;window.__fpro.update({siteEngine:'upstream',enhance:true,appBanner:false,textSelection:true,selectionScope:'posts',color:'طبيعي'});return JSON.stringify({first,exposed:window.exposed59||0,restored:getComputedStyle(document.getElementById('bar')).display!=='none'});})()"""){value->if(value!="null"){result.set(value);done.countDown()}else if(attempt<60)web.postDelayed({probe(attempt+1)},150)}}
                web.postDelayed({probe(0)},150)
            }
            assertTrue("Production document fixture must finish",done.await(15,TimeUnit.SECONDS))
            val data=org.json.JSONObject(org.json.JSONArray("["+result.get()+"]").getString(0));val first=data.getJSONObject("first")
            for(key in listOf("early","plain","bar","wrapped","search","account","input","main"))assertTrue("First-frame $key: $data",first.getBoolean(key))
            assertEquals("No exposed samples during repeated inline-important rewrites",0,data.getInt("exposed"))
            assertTrue("OFF restores prompt",data.getBoolean("restored"))
        }} finally {val edit=store.edit();keys.forEach {key->when(val value=previous[key]){is Boolean->edit.putBoolean(key,value);is String->edit.putString(key,value);else->edit.remove(key)}};edit.commit()}
    }
    @Test fun nativeCopyIsAvailableForPostsAndHashtagsButNotComments() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val automation = instrumentation.getUiAutomation(0)
        val info = automation.serviceInfo
        info.flags = info.flags or android.accessibilityservice.AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS
        automation.serviceInfo = info
        ActivityScenario.launch<MainActivity>(android.content.Intent().setClassName(instrumentation.targetContext.packageName, "com.almekhlafi.FPRO.MainActivity")).use { scenario ->
            awaitBrowserReady(scenario)
            Thread.sleep(2300)
            val ready = CountDownLatch(1)
            scenario.onActivity { activity ->
                val web = requireNotNull(findWeb(activity.window.decorView))
                web.stopLoading()
                web.loadDataWithBaseURL("https://fixture.invalid/", """
                    <html><meta name="viewport" content="width=device-width,initial-scale=1">
                    <style>p,span,a{-webkit-user-select:none;user-select:none}body{margin:24px;font:24px sans-serif}p{margin:24px 0}</style>
                    <body><article role="button" style="user-select:none!important;-webkit-user-select:none!important"><p id="post" style="user-select:none!important;-webkit-user-select:none!important">FPROpost selection sample</p><div role="comment" data-commentid="1"><p><span id="comment" dir="auto" style="user-select:none!important;-webkit-user-select:none!important">FPROcomment selection sample</span></p></div><p><a id="hashtag" href="/hashtag/sample" style="user-select:none!important;-webkit-user-select:none!important">#FPROhashtag</a></p><button>Like</button><div role="button" aria-haspopup="dialog"><span id="wrappedPlain" style="user-select:none!important;-webkit-user-select:none!important">FPROwrapped plain reading sample</span></div></article><div id="bare" style="user-select:none!important;-webkit-user-select:none!important">FPRObare direct div sample</div>
                    <script>document.addEventListener('contextmenu',e=>e.preventDefault(),true);document.addEventListener('selectstart',e=>e.preventDefault(),true);document.addEventListener('pointerdown',e=>e.preventDefault(),true);document.addEventListener('touchstart',e=>e.preventDefault(),{passive:false});</script></body></html>
                """.trimIndent(), "text/html", "UTF-8", null)
                fun probe(attempt: Int) {
                    web.evaluateJavascript("!!document.querySelector('#hashtag') && document.readyState==='complete'") { result ->
                        if(result == "true") {
                            val source = activity.assets.open("facebook.js").bufferedReader().use { it.readText() }.replace("__CONFIG__", "{\"enhance\":false,\"textSelection\":true,\"selectionScope\":\"posts\"}")
                            web.evaluateJavascript(source) {
                                web.evaluateJavascript("!!window.__fpro && !!document.querySelector('#fpro-selection-style')") { installed ->
                                if(installed == "true")web.postVisualStateCallback(20, object : WebView.VisualStateCallback() { override fun onComplete(requestId: Long) { ready.countDown() } })
                                }
                            }
                        } else if(attempt < 30) web.postDelayed({ probe(attempt+1) }, 200)
                    }
                }
                web.postDelayed({ probe(0) }, 200)
            }
            assertTrue("Native selection fixture must render", ready.await(10, TimeUnit.SECONDS))
            fun copyAction(node: android.view.accessibility.AccessibilityNodeInfo?): android.view.accessibility.AccessibilityNodeInfo? {
                if(node == null)return null
                val label=node.text?.toString().orEmpty()
                if(label.equals(instrumentation.targetContext.getString(android.R.string.copy),ignoreCase=true))return node
                for(index in 0 until node.childCount)copyAction(node.getChild(index))?.let { return it }
                return null
            }
            fun nativeCopyAction(): android.view.accessibility.AccessibilityNodeInfo? {
                copyAction(automation.rootInActiveWindow)?.let { return it }
                for(window in automation.windows)copyAction(window.root)?.let { return it }
                return null
            }
            for(id in listOf("post", "hashtag", "comment")) {
                val coordinates = FloatArray(2)
                val measured = CountDownLatch(1)
                scenario.onActivity { activity ->
                    val web = requireNotNull(findWeb(activity.window.decorView))
                    web.evaluateJavascript("""
                        (()=>{getSelection().removeAllRanges();const e=document.getElementById('$id'),r=document.createRange();r.setStart(e.firstChild,1);r.setEnd(e.firstChild,5);const b=r.getBoundingClientRect();return JSON.stringify({x:b.left+b.width/2,y:b.top+b.height/2,w:innerWidth});})()
                    """.trimIndent()) { result ->
                        val data=org.json.JSONObject(org.json.JSONArray("[$result]").getString(0))
                        val offset=IntArray(2);web.getLocationOnScreen(offset)
                        val scale=web.width/data.getDouble("w")
                        coordinates[0]=(offset[0]+data.getDouble("x")*scale).toFloat()
                        coordinates[1]=(offset[1]+data.getDouble("y")*scale).toFloat()
                        web.postVisualStateCallback(21, object : WebView.VisualStateCallback() { override fun onComplete(requestId: Long) { measured.countDown() } })
                    }
                }
                assertTrue(measured.await(5, TimeUnit.SECONDS))
                val down=android.os.SystemClock.uptimeMillis()
                val press=android.view.MotionEvent.obtain(down,down,android.view.MotionEvent.ACTION_DOWN,coordinates[0],coordinates[1],0)
                press.source=android.view.InputDevice.SOURCE_TOUCHSCREEN
                assertTrue(automation.injectInputEvent(press,true));press.recycle()
                Thread.sleep(android.view.ViewConfiguration.getLongPressTimeout().toLong()+400)
                val release=android.view.MotionEvent.obtain(down,android.os.SystemClock.uptimeMillis(),android.view.MotionEvent.ACTION_UP,coordinates[0],coordinates[1],0)
                release.source=android.view.InputDevice.SOURCE_TOUCHSCREEN
                // Native floating selection toolbar can change input focus before
                // ACTION_UP is acknowledged. The actual selection and Copy UI,
                // not that dispatcher acknowledgement, are the assertions.
                automation.injectInputEvent(release,false);release.recycle()
                Thread.sleep(300)
                val selected=CountDownLatch(1)
                val text=java.util.concurrent.atomic.AtomicReference("")
                scenario.onActivity { activity ->
                    requireNotNull(findWeb(activity.window.decorView)).evaluateJavascript("getSelection().toString()") { result ->text.set(result);selected.countDown()}
                }
                assertTrue(selected.await(5,TimeUnit.SECONDS))
                if(id=="comment") {
                    assertFalse("Comments must not gain native selection from FPRO: ${text.get()}",text.get().contains("FPRO"))
                    if(android.os.Build.VERSION.SDK_INT>=35)automation.clearCache()
                    assertNull("Comments must not show Android Copy",nativeCopyAction())
                    continue
                }
                assertTrue("Real long press must select $id text, not a programmatic range: ${text.get()}", text.get().contains("FPRO"))
                var copyVisible=false
                repeat(15) {
                    if(android.os.Build.VERSION.SDK_INT>=35)automation.clearCache()
                    if(nativeCopyAction()!=null)copyVisible=true
                    if(!copyVisible)Thread.sleep(100)
                }
                assertTrue("Android's native Copy action must appear for $id",copyVisible)
                // Use the actual Android Copy action. Unlike a page tap,
                // this also dismisses selection when the site's root cancels taps.
                val copy= requireNotNull(nativeCopyAction())
                assertTrue("Native Copy action must be clickable",copy.performAction(android.view.accessibility.AccessibilityNodeInfo.ACTION_CLICK)||copy.parent?.performAction(android.view.accessibility.AccessibilityNodeInfo.ACTION_CLICK)==true)
                Thread.sleep(350)

            }
        }
    }

}
