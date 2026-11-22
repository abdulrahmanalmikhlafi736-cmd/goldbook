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

/** Real H264 playback + production scripts; NOT a device temperature/power measurement. */
@RunWith(AndroidJUnit4::class)
class VideoColorWorkloadTest {
 private fun find(v:View):WebView? {if(v is WebView)return v;if(v is ViewGroup)for(i in 0 until v.childCount)find(v.getChildAt(i))?.let{return it};return null}
 @Test fun decodedVideoAndClockDoNotRescanUnrelatedColors() {
  val inst=InstrumentationRegistry.getInstrumentation()
  val clip=Base64.encodeToString(inst.context.assets.open("video-workload.mp4").use{it.readBytes()},Base64.NO_WRAP)
  ActivityScenario.launch<MainActivity>(android.content.Intent().setClassName(inst.targetContext.packageName,"com.almekhlafi.FPRO.MainActivity")).use { scenario ->
   awaitBrowserReady(scenario);Thread.sleep(2300)
   fun js(code:String):String {val done=CountDownLatch(1);val result=AtomicReference("");scenario.onActivity{a->find(a.window.decorView)!!.evaluateJavascript(code){result.set(it);done.countDown()}};assertTrue(done.await(15,TimeUnit.SECONDS));return result.get()}
   scenario.onActivity{a->val web=find(a.window.decorView)!!;web.settings.mediaPlaybackRequiresUserGesture=false
    val cards=(0 until 120).joinToString(""){ "<article><p style='color:rgb(8,102,255);'>Post</p></article>" }
    web.loadDataWithBaseURL("https://fixture.invalid/","""
     <!doctype html><html><head><meta name='viewport' content='width=device-width,initial-scale=1'></head><body>
     <video id='player' muted autoplay loop playsinline style='width:320px;height:180px' src='data:video/mp4;base64,$clip'></video>
     <span id='siteClock'>0</span><main>$cards</main></body></html>
    """.trimIndent(),"text/html","UTF-8",null)
   }
   Thread.sleep(2000)
   val cfg="{siteEngine:'upstream',enhance:true,appBanner:true,referenceEngine:true,color:'ذهبي',downloads:true,rainbow:true,textSelection:true,selectionScope:'posts'}"
   scenario.onActivity{a->val source=listOf("feed-return.js","app-prompt-engine.js","site-engine.js","reference-engines.js","audio-mode.js","facebook.js").joinToString("\n"){a.assets.open(it).bufferedReader().use{r->r.readText()}}.replace("__CONFIG__",cfg);find(a.window.decorView)!!.evaluateJavascript(source,null)}
   js("player.muted=true;player.play().catch(e=>window.playError=e.name+':'+e.message);true")
   // Capture readiness/playback/frames atomically. Separate JS queries can straddle
   // a looping clip boundary and disagree despite successful decoded playback.
   val sample="JSON.stringify({paused:player.paused,ready:player.readyState,network:player.networkState,error:player.error&&{code:player.error.code,message:player.error.message},frames:player.getVideoPlaybackQuality().totalVideoFrames})"
   fun samplePlayback()=org.json.JSONObject(org.json.JSONArray("["+js(sample)+"]").getString(0))
   var playback=samplePlayback()
   val playbackDeadline=android.os.SystemClock.elapsedRealtime()+10_000
   while((playback.getBoolean("paused")||playback.getInt("ready")<2||playback.getInt("frames")==0)&&android.os.SystemClock.elapsedRealtime()<playbackDeadline){Thread.sleep(100);playback=samplePlayback()}
   assertFalse("Real playback must start: $playback",playback.getBoolean("paused"))
   assertTrue("Actual decoded playback required: $playback",playback.getInt("ready")>=2&&playback.getInt("frames")>0)
   assertEquals("true",js("getComputedStyle(document.querySelector('main p')).color!=='rgb(8, 102, 255)'"))
   js("""
    window.colorQueries=0;window.fullColorQueries=0;window.videoUpdates=0;window.clockUpdates=0;
    window.startFrames=player.getVideoPlaybackQuality().totalVideoFrames;
    const colorSelectors=new Set(['style','[style*="color"]','[style*="background-color"]','[style*="background"]','[style*="border:"]','[style*="--nbc"]']);
    for(const p of [Document.prototype,Element.prototype]){const q=p.querySelectorAll;p.querySelectorAll=function(s){if(colorSelectors.has(s)){colorQueries++;if(this===document)fullColorQueries++;}return q.call(this,s);};}
    player.addEventListener('timeupdate',()=>videoUpdates++);
    window.clockTimer=setInterval(()=>{siteClock.textContent=String(++clockUpdates);},250);true
   """.trimIndent())
   Thread.sleep(5000)
   val result=org.json.JSONObject(org.json.JSONArray("["+js("clearInterval(clockTimer);JSON.stringify({queries:colorQueries,fullQueries:fullColorQueries,updates:videoUpdates,clockUpdates,frames:player.getVideoPlaybackQuality().totalVideoFrames-startFrames,errors:FproSiteEngine.report().errors})")+"]").getString(0))
   assertTrue("Real progress events: $result",result.getInt("updates")>=4)
   assertTrue("Video frames actually decoded: $result",result.getInt("frames")>12)
   assertTrue("Website clock updated: $result",result.getInt("clockUpdates")>=8)
   assertEquals("No progress/clock global color queries: $result",0,result.getInt("fullQueries"))
   assertEquals("No progress/clock target subtree color queries: $result",0,result.getInt("queries"))
   assertEquals(0,result.getJSONArray("errors").length())
   js("document.querySelector('main p').style.color='rgb(8,102,255)';true");Thread.sleep(150)
   assertEquals("true",js("getComputedStyle(document.querySelector('main p')).color!=='rgb(8, 102, 255)'"))
   js("const fresh=document.createElement('p');fresh.id='freshColor';fresh.style.color='rgb(8,102,255)';document.body.append(fresh);true");Thread.sleep(150)
   assertEquals("true",js("getComputedStyle(freshColor).color!=='rgb(8, 102, 255)'"))
   js("FproSiteEngine.update({...$cfg,enhance:false});player.pause();true");Thread.sleep(100)
   assertEquals("true",js("document.querySelector('main p').style.color==='rgb(8, 102, 255)'"))
   android.util.Log.i("FPRO_VIDEO_AUDIT",result.toString())
  }
 }
}
