package com.almekhlafi.FPRO

import android.util.Base64
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

/** Trusted card activation + actual media; synthetic page, not the owner account. */
@RunWith(AndroidJUnit4::class)
class ReelsViewerRegressionTest {
 private fun find(v:View):WebView?{if(v is WebView)return v;if(v is ViewGroup)for(i in 0 until v.childCount)find(v.getChildAt(i))?.let{return it};return null}
 @Test fun openedReelIsNotBlankedByFeedFilter() {
  val inst=InstrumentationRegistry.getInstrumentation()
  val clip=Base64.encodeToString(inst.context.assets.open("video-workload.mp4").use{it.readBytes()},Base64.NO_WRAP)
  ActivityScenario.launch<MainActivity>(android.content.Intent().setClassName(inst.targetContext.packageName,"com.almekhlafi.FPRO.MainActivity")).use { scenario ->
   awaitBrowserReady(scenario);Thread.sleep(2300)
   fun js(code:String):String{val done=CountDownLatch(1);val result=AtomicReference("");scenario.onActivity{a->find(a.window.decorView)!!.evaluateJavascript(code){result.set(it);done.countDown()}};assertTrue(done.await(15,TimeUnit.SECONDS));return result.get()}
   scenario.onActivity{a->find(a.window.decorView)!!.loadDataWithBaseURL("https://fixture.invalid/","""
    <!doctype html><meta name='viewport' content='width=device-width,initial-scale=1'><body style='margin:0'>
    <div id='clip' data-tracking-duration-id='42'><div class='fl ac'><span class='native-text' id='reelIcon'></span></div>
    <button id='openReel' style='width:240px;height:60px'>Open Reel</button>
    <video id='player' muted loop playsinline preload='auto' style='width:320px;height:180px' src='data:video/mp4;base64,$clip'></video></div></body>
   """.trimIndent(),"text/html","UTF-8",null)}
   Thread.sleep(1500)
   val cfg="{siteEngine:'upstream',enhance:true,reels:true,appBanner:true,referenceEngine:true,color:'طبيعي',textSelection:false,downloads:false,rainbow:false}"
   scenario.onActivity{a->val src=listOf("feed-return.js","app-prompt-engine.js","site-engine.js","reference-engines.js","audio-mode.js","facebook.js").joinToString("\n"){a.assets.open(it).bufferedReader().use{r->r.readText()}}.replace("__CONFIG__",cfg);find(a.window.decorView)!!.evaluateJavascript(src,null)}
   js("window.siteOpens=0;openReel.onclick=()=>{siteOpens++;history.pushState({site:true},'', '/reel/42/');reelIcon.textContent='󲀠';player.muted=true;player.play().catch(e=>window.playError=e.name);};true")
   val xy=FloatArray(2)
   scenario.onActivity{a->val web=find(a.window.decorView)!!;val loc=IntArray(2);web.getLocationOnScreen(loc);xy[0]=loc[0]+100*web.resources.displayMetrics.density;xy[1]=loc[1]+30*web.resources.displayMetrics.density}
   val down=android.os.SystemClock.uptimeMillis()
   for(kind in listOf(android.view.MotionEvent.ACTION_DOWN,android.view.MotionEvent.ACTION_UP)){val e=android.view.MotionEvent.obtain(down,android.os.SystemClock.uptimeMillis(),kind,xy[0],xy[1],0);e.source=android.view.InputDevice.SOURCE_TOUCHSCREEN;assertTrue(inst.uiAutomation.injectInputEvent(e,true));e.recycle()}
   Thread.sleep(1500)
   assertEquals("Trusted activation reaches the site", "1",js("siteOpens"))
   assertEquals("History state is preserved", "true",js("location.pathname==='/reel/42/'&&history.state.site===true"))
   assertEquals("Feed classifier must not blank the opened viewer", "true",js("getComputedStyle(clip).display!=='none'&&player.getBoundingClientRect().height>100"))
   repeat(16){if(js("!player.paused&&player.readyState>=2")!="true")Thread.sleep(500)}
   assertEquals("Opened video plays under real user gesture policy", "true",js("!player.paused&&player.readyState>=2"))
   assertTrue("Real frames reported",js("player.getVideoPlaybackQuality().totalVideoFrames").toInt()>0)
   assertEquals("No engine errors", "0",js("FproSiteEngine.report().errors.length"))
   android.util.Log.i("FPRO_REELS_VIEWER",js("JSON.stringify({visible:getComputedStyle(clip).display!=='none',opens:siteOpens,frames:player.getVideoPlaybackQuality().totalVideoFrames,errors:FproSiteEngine.report().errors})"))
   js("player.pause();true")
  }
 }
}
