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

/** Real Android WebView + trusted input; synthetic page, NOT a private Facebook account. */
@RunWith(AndroidJUnit4::class)
class PromptWorkAuditTest {
 private fun find(v: View): WebView? { if(v is WebView)return v; if(v is ViewGroup)for(i in 0 until v.childCount)find(v.getChildAt(i))?.let{return it};return null }
 @Test fun promptToggleUnderHeldTouch() {
  val inst=InstrumentationRegistry.getInstrumentation()
  ActivityScenario.launch<MainActivity>(android.content.Intent().setClassName(inst.targetContext.packageName,"com.almekhlafi.FPRO.MainActivity")).use { scenario ->
   awaitBrowserReady(scenario);Thread.sleep(2300)
   fun js(code:String):String {val latch=CountDownLatch(1);val result=AtomicReference("");scenario.onActivity{a->requireNotNull(find(a.window.decorView)).evaluateJavascript(code){result.set(it);latch.countDown()}};assertTrue(latch.await(15,TimeUnit.SECONDS));return result.get()}
   scenario.onActivity { a ->
    val cards=(0 until 600).joinToString(""){i->"<article><div class='native-text'>Reading $i</div><div role='button'><span>Like</span></div></article>"}
    find(a.window.decorView)!!.loadDataWithBaseURL("https://fixture.invalid/","<html><head><meta name='viewport' content='width=device-width,initial-scale=1'></head><body><button id='action' style='position:fixed;top:20px;left:20px;z-index:9999;width:100px;height:50px'>Like</button><main id='feed' role='feed'>$cards</main><div id='bar' class='bottom fixed-container' data-actual-height='48' style='position:fixed;bottom:0;height:48px'><button id='cta'>فتح التطبيق</button></div></body></html>","text/html","UTF-8",null)
   }
   Thread.sleep(900)
   assertEquals("true",js("document.readyState==='complete'&&!!document.getElementById('feed')"))
   scenario.onActivity{a->find(a.window.decorView)!!.evaluateJavascript(a.assets.open("app-prompt-engine.js").bufferedReader().use{it.readText()},null)}
   val cfg="{siteEngine:'upstream',enhance:true,appBanner:true}"
   js("""
    window.auditQ=0;window.auditReturned=0;window.auditPointers=0;window.auditClicks=0;window.auditLag=[];
    action.addEventListener('pointerdown',e=>{auditPointers++;auditLag.push(Math.max(0,performance.now()-e.timeStamp));});
    action.addEventListener('click',()=>auditClicks++);
    for(const p of [Document.prototype,Element.prototype]){const q=p.querySelectorAll;p.querySelectorAll=function(s){const r=q.call(this,s);auditQ++;auditReturned+=r.length;return r;};}
    window.runPromptAudit=()=>{window.auditResult=null;auditQ=0;auditReturned=0;let n=0;const start=performance.now(),checked=FproPrompt.report().checked;function tick(){if(n===6){auditResult={queries:auditQ,returned:auditReturned,checked:FproPrompt.report().checked-checked,elapsedMs:performance.now()-start,pointers:auditPointers,clicks:auditClicks,eventLagMs:auditLag.slice()};return;}for(let k=0;k<30;k++)feed.style.opacity=String((n*30+k+1)/200);n++;setTimeout(tick,16);}tick();};
   """.trimIndent())
   // Same six batches of thirty ancestor style writes, only appBanner changes.
   fun sample(on:Boolean):org.json.JSONObject {
    js("FproPrompt.update({...$cfg,appBanner:$on});true");Thread.sleep(150)
    val xy=FloatArray(2);scenario.onActivity{a->val w=find(a.window.decorView)!!;val loc=IntArray(2);w.getLocationOnScreen(loc);xy[0]=loc[0]+60*w.resources.displayMetrics.density;xy[1]=loc[1]+40*w.resources.displayMetrics.density}
    val down=android.os.SystemClock.uptimeMillis()
    fun event(kind:Int){val e=android.view.MotionEvent.obtain(down,android.os.SystemClock.uptimeMillis(),kind,xy[0],xy[1],0);e.source=android.view.InputDevice.SOURCE_TOUCHSCREEN;assertTrue(inst.uiAutomation.injectInputEvent(e,true));e.recycle()}
    event(android.view.MotionEvent.ACTION_DOWN)
    js("runPromptAudit();true");Thread.sleep(450)
    event(android.view.MotionEvent.ACTION_UP);Thread.sleep(100)
    val raw=js("JSON.stringify({...auditResult,clicks:auditClicks,hidden:getComputedStyle(bar).display==='none'})")
    return org.json.JSONObject(org.json.JSONArray("[$raw]").getString(0))
   }
   val off=sample(false);val on=sample(true)
   assertFalse(off.getBoolean("hidden"));assertTrue(on.getBoolean("hidden"))
   assertTrue("Trusted input reached page: $on",on.getInt("pointers")>0)
   assertTrue("Site click survived: $on",on.getInt("clicks")>off.getInt("clicks"))
   if(InstrumentationRegistry.getArguments().getString("expectOptimized", "true")=="true") {
    assertTrue("No ancestor subtree rescans: $on",on.getInt("returned")<30)
    assertTrue("Bounded prompt checks: $on",on.getInt("checked")<60)
   } else assertTrue("Baseline reproduces scan fanout: $on",on.getInt("returned")>1000)
   // Same-node re-show must be corrected by the next observer checkpoint.
   js("bar.style.setProperty('display','block','important');true");Thread.sleep(100)
   assertEquals("true",js("getComputedStyle(bar).display==='none'"))
   js("FproPrompt.update({...$cfg,appBanner:false});true")
   assertEquals("true",js("getComputedStyle(bar).display!=='none'&&FproPrompt.report().retained===0"))
   val evidence=org.json.JSONObject().put("off",off).put("on",on).toString()
   android.util.Log.i("FPRO_PROMPT_AUDIT",evidence)
   java.io.File(inst.targetContext.filesDir,"prompt-work-audit.json").writeText(evidence)
  }
 }
}
