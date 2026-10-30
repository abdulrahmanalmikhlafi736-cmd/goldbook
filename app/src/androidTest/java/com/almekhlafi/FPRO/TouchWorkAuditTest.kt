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

/** Diagnostic baseline only. No account DOM or universal input-latency claim. */
@RunWith(AndroidJUnit4::class)
class TouchWorkAuditTest {
 private fun find(view:View):WebView? {if(view is WebView)return view;if(view is ViewGroup)for(i in 0 until view.childCount)find(view.getChildAt(i))?.let{return it};return null}
 @Test fun unrelatedMutationsRevalidateAllCommentsDuringRealHeldTouch() {
  val instrumentation=InstrumentationRegistry.getInstrumentation()
  ActivityScenario.launch<MainActivity>(android.content.Intent().setClassName(instrumentation.targetContext.packageName,"com.almekhlafi.FPRO.MainActivity")).use { scenario ->
   awaitBrowserReady(scenario);Thread.sleep(2300)
   fun js(code:String):String {val done=CountDownLatch(1);val result=AtomicReference("");scenario.onActivity { activity ->requireNotNull(find(activity.window.decorView)).evaluateJavascript(code){result.set(it);done.countDown()}};assertTrue("JS callback must finish",done.await(15,TimeUnit.SECONDS));return result.get()}
   val ready=CountDownLatch(1)
   scenario.onActivity { activity ->
    val cards=(0 until 240).joinToString(""){i->"<article><p>Post $i</p><div><a href='/profile.php?id=4'>Author</a><span dir='auto'>Comment</span><a href='/story.php?comment_id=${i+1}'>2h</a><button>Reply</button></div></article>"}
    requireNotNull(find(activity.window.decorView)).loadDataWithBaseURL("https://fixture.invalid/","<html><meta name='viewport' content='width=device-width,initial-scale=1'><body><button id='action' style='position:fixed;top:20px;left:20px;z-index:999'>Like</button><main role='feed'>$cards</main><div id='changing'></div></body></html>","text/html","UTF-8",null)
    ready.countDown()
   }
   assertTrue(ready.await(5,TimeUnit.SECONDS));Thread.sleep(700)
   assertEquals("true",js("document.readyState==='complete' && !!document.getElementById('changing')"))
   js("""
    window.auditQ=0;window.auditPointer=0;
    document.addEventListener('pointerdown',()=>window.auditPointer++,true);
    for(const p of [Document.prototype,Element.prototype]){const q=p.querySelectorAll;p.querySelectorAll=function(s){window.auditQ++;return q.call(this,s);};}
    window.runAudit=function(){window.auditResult=null;window.auditQ=0;let n=0;const start=performance.now();function tick(){if(n===6){window.auditResult={queries:window.auditQ,elapsed:performance.now()-start,pointers:window.auditPointer};return;}document.getElementById('changing').className='tick'+n++;setTimeout(tick,16);}tick();};
   """.trimIndent())
   val cfg="{siteEngine:'upstream',enhance:true,appBanner:true,textSelection:true,selectionScope:'posts',color:'طبيعي',referenceEngine:true}"
   scenario.onActivity { activity ->
    // Only read production assets; no modified runtime or fake Facebook UI.
    for(name in listOf("app-prompt-engine.js","site-engine.js","reference-engines.js","audio-mode.js","facebook.js")) {
     val source=activity.assets.open(name).bufferedReader().use{it.readText()}.replace("__CONFIG__",cfg)
     requireNotNull(find(activity.window.decorView)).evaluateJavascript(source,null)
    }
   }
   Thread.sleep(600)
   fun sample():org.json.JSONObject {
    val point=FloatArray(2);scenario.onActivity { activity ->val web=requireNotNull(find(activity.window.decorView));val offset=IntArray(2);web.getLocationOnScreen(offset);point[0]=offset[0]+45*web.resources.displayMetrics.density;point[1]=offset[1]+35*web.resources.displayMetrics.density}
    val down=android.os.SystemClock.uptimeMillis()
    val press=android.view.MotionEvent.obtain(down,down,android.view.MotionEvent.ACTION_DOWN,point[0],point[1],0);press.source=android.view.InputDevice.SOURCE_TOUCHSCREEN
    assertTrue(instrumentation.uiAutomation.injectInputEvent(press,true));press.recycle()
    js("window.runAudit();true");Thread.sleep(450)
    val value=js("JSON.stringify(window.auditResult)")
    val release=android.view.MotionEvent.obtain(down,android.os.SystemClock.uptimeMillis(),android.view.MotionEvent.ACTION_UP,point[0],point[1],0);release.source=android.view.InputDevice.SOURCE_TOUCHSCREEN;instrumentation.uiAutomation.injectInputEvent(release,false);release.recycle()
    return org.json.JSONObject(org.json.JSONArray("[$value]").getString(0))
   }
   val active=sample()
   js("window.__fpro.update({...$cfg,textSelection:false});true");Thread.sleep(350)
   val isolated=sample()
   assertTrue("Trusted touch must reach the website button: $active",active.getInt("pointers")>0)
   assertTrue("Baseline must reproduce full retained-comment query fanout: $active",active.getInt("queries")>3000)
   assertTrue("Isolation must remove retained-comment query fanout, not all page work: $isolated",isolated.getInt("queries")<200)
   // Report counts in the Checks API without text/URLs/account information.
   java.io.File(instrumentation.targetContext.filesDir,"touch-audit.json").writeText(org.json.JSONObject().put("held",active).put("isolated",isolated).toString())
  }
 }
}
