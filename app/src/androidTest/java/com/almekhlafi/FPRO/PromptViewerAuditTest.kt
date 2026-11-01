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

/** Confirms a defect in unchanged production. NOT a fix/acceptance test. */
@RunWith(AndroidJUnit4::class)
class PromptViewerAuditTest {
 private fun find(v:View):WebView?{if(v is WebView)return v;if(v is ViewGroup)for(i in 0 until v.childCount)find(v.getChildAt(i))?.let{return it};return null}
 @Test fun unchangedPromptEngineCanBlankLargeMediaOwnerAndOffRestoresIt() {
  val inst=InstrumentationRegistry.getInstrumentation()
  val clip=Base64.encodeToString(inst.context.assets.open("video-workload.mp4").use{it.readBytes()},Base64.NO_WRAP)
  ActivityScenario.launch<MainActivity>(android.content.Intent(inst.targetContext,MainActivity::class.java)).use { scenario ->
   awaitBrowserReady(scenario);Thread.sleep(2300)
   fun js(code:String):String{val done=CountDownLatch(1);val value=AtomicReference("");scenario.onActivity{a->find(a.window.decorView)!!.evaluateJavascript(code){value.set(it);done.countDown()}};assertTrue(done.await(10,TimeUnit.SECONDS));return value.get()}
   scenario.onActivity{a->find(a.window.decorView)!!.loadDataWithBaseURL("https://fixture.invalid/","""
    <!doctype html><meta name='viewport' content='width=device-width,initial-scale=1'>
    <style>body{margin:0;background:white}#viewer{width:100vw;height:100vh;background:#123456}#start{position:fixed;top:0;left:0;width:160px;height:50px;z-index:2}</style>
    <div id='viewer' role='button' aria-label='Open app'><div id='host'></div></div>
    <button id='start'>Start local media</button><button id='cta'>Open app</button>
    <p>Offline diagnostic media fixture. No account, cookies, network media or personal content.</p>
    <script>
    const root=host.attachShadow({mode:'open'});
    root.innerHTML='<video id="actualPlayer" muted loop playsinline preload="auto" style="width:100%;height:100vh" src="data:video/mp4;base64,$clip"></video>';
    window.savedPlayer=root.getElementById('actualPlayer');start.onclick=()=>savedPlayer.play().catch(e=>window.playError=e.name);
    </script>
   """.trimIndent(),"text/html","UTF-8",null)}
   Thread.sleep(1500)
   scenario.onActivity{a->val w=find(a.window.decorView)!!;w.evaluateJavascript(a.assets.open("app-prompt-engine.js").bufferedReader().use{it.readText()},null)}
   val xy=FloatArray(2);scenario.onActivity{a->val w=find(a.window.decorView)!!;val loc=IntArray(2);w.getLocationOnScreen(loc);xy[0]=loc[0]+80*w.resources.displayMetrics.density;xy[1]=loc[1]+25*w.resources.displayMetrics.density}
   val down=android.os.SystemClock.uptimeMillis()
   for(kind in listOf(android.view.MotionEvent.ACTION_DOWN,android.view.MotionEvent.ACTION_UP)){val e=android.view.MotionEvent.obtain(down,android.os.SystemClock.uptimeMillis(),kind,xy[0],xy[1],0);e.source=android.view.InputDevice.SOURCE_TOUCHSCREEN;assertTrue(inst.uiAutomation.injectInputEvent(e,true));e.recycle()}
   val until=android.os.SystemClock.elapsedRealtime()+10000
   while(js("!savedPlayer.paused&&savedPlayer.readyState>=2&&savedPlayer.getVideoPlaybackQuality().totalVideoFrames>0")!="true"&&android.os.SystemClock.elapsedRealtime()<until)Thread.sleep(100)
   assertEquals("Actual H264 playback before toggling filter", "true",js("!savedPlayer.paused&&savedPlayer.readyState>=2&&savedPlayer.getVideoPlaybackQuality().totalVideoFrames>0"))
   val frames=js("savedPlayer.getVideoPlaybackQuality().totalVideoFrames")
   assertEquals("Visible media before filter", "true",js("viewer.getBoundingClientRect().height>160"))
   js("FproPrompt.update({siteEngine:'upstream',enhance:true,appBanner:true});true");Thread.sleep(200)
   assertEquals("CONFIRMED DEFECT: ON hides the entire media owner", "true",js("getComputedStyle(viewer).display==='none'&&viewer.getBoundingClientRect().height===0"))
   assertEquals("Real CTA is hidden too", "none",js("getComputedStyle(cta).display").trim('"'))
   js("FproPrompt.update({siteEngine:'upstream',enhance:true,appBanner:false});true");Thread.sleep(200)
   assertEquals("OFF restores the same media owner without navigation", "true",js("viewer.getBoundingClientRect().height>160&&savedPlayer===host.shadowRoot.getElementById('actualPlayer')"))
   android.util.Log.i("FPRO_PROMPT_VIEWER","KNOWN_DEFECT_CONFIRMED decodedFrames=$frames ON=owner-hidden OFF=owner-visible samePlayer=true; fixture not Facebook-account proof")
   js("savedPlayer.pause();true")
  }
 }
}
