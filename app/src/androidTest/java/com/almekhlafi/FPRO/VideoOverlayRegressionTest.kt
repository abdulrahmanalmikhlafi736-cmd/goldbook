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

/** Real Chromium layout/animation test. Media state is a controlled fixture,
 * not a claim of decoded audio or an authenticated Facebook player.
 */
@RunWith(AndroidJUnit4::class)
class VideoOverlayRegressionTest {
    private fun findWeb(view: View): WebView? {
        if (view is WebView) return view
        if (view is ViewGroup) for (i in 0 until view.childCount) findWeb(view.getChildAt(i))?.let { return it }
        return null
    }
    @Test fun resurrectedCtaAndCompleteRotatingBallWithOneTimeline() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        ActivityScenario.launch<MainActivity>(android.content.Intent(instrumentation.targetContext, MainActivity::class.java)).use { scenario ->
            Thread.sleep(2300)
            val done = CountDownLatch(1)
            val result = AtomicReference("null")
            scenario.onActivity { activity ->
                val web = requireNotNull(findWeb(activity.window.decorView))
                web.stopLoading()
                val config = """{"enhance":true,"rainbow":true,"downloads":true,"appBanner":true,"referenceEngine":true,"textSelection":false,"color":"تلقائي"}"""
                val source = activity.assets.open("reference-engines.js").bufferedReader().use { it.readText() } + "\n" + activity.assets.open("facebook.js").bufferedReader().use { it.readText() }.replace("__CONFIG__", config)
                web.webViewClient = object : android.webkit.WebViewClient() {
                    override fun onPageFinished(view: WebView, url: String) {
                        view.evaluateJavascript("!!document.getElementById('fixtureVideo') && !window.overlayTestStarted") { ready ->
                            if (ready != "true") return@evaluateJavascript
                            view.evaluateJavascript("window.overlayTestStarted=true;" + source) {
                                view.evaluateJavascript("""
                                    (async()=>{
                                     try{
                                      const frames=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
                                      const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
                                      history.replaceState({},'', '/reel/letterboxed');
                                      const v=document.getElementById('fixtureVideo'),cta=document.getElementById('fixtureCTA');
                                      window.fixturePlaying=false;
                                      Object.defineProperty(v,'paused',{get:()=>!window.fixturePlaying});
                                      Object.defineProperty(v,'duration',{get:()=>120});
                                      cta.style.setProperty('display','block','important');await frames();
                                      const ctaHidden=getComputedStyle(cta).display==='none';
                                      const config=$config;window.__fpro.update(config);await frames();
                                      const ball=document.querySelector('.fpro-ball'),overlay=document.querySelector('.fpro-video-tools');
                                      const fits=[];
                                      for(const time of [0,60,120]){
                                       v.currentTime=time;v.dispatchEvent(new Event('timeupdate'));await frames();
                                       const b=ball.getBoundingClientRect(),r=overlay.getBoundingClientRect();
                                       fits.push(b.width>=15&&b.height>=15&&b.left>=r.left&&b.right<=r.right&&b.top>=r.top&&b.bottom<=r.bottom&&b.bottom<=innerHeight);
                                      }
                                      window.fixturePlaying=true;v.dispatchEvent(new Event('play'));await frames();
                                      const before=getComputedStyle(ball).transform;await sleep(180);const after=getComputedStyle(ball).transform;
                                      window.fixturePlaying=false;v.dispatchEvent(new Event('pause'));await frames();
                                      const paused=getComputedStyle(ball).transform;await sleep(180);const stopped=getComputedStyle(ball).transform;
                                      const native=document.getElementById('fixtureSeek'),volume=document.getElementById('fixtureVolume');
                                      const line=document.querySelector('.fpro-fill').getBoundingClientRect(),original=native.getBoundingClientRect();
                                      const aligned=Math.abs((line.top+line.height/2)-(original.top+original.height/2))<1;
                                      const oneTimeline=getComputedStyle(native).visibility==='hidden'&&getComputedStyle(volume).visibility!=='hidden';
                                      window.__fpro.update({...config,rainbow:false,amoled:true,dark:true});await frames();
                                      const backdrop=document.createElement('div');backdrop.setAttribute('role','dialog');backdrop.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.2)';document.body.appendChild(backdrop);await frames();
                                      const transparentReaction=getComputedStyle(backdrop).backgroundColor==='rgba(0, 0, 0, 0.2)';
                                      window.overlayResults=JSON.stringify({transparentReaction,ctaHidden,search:getComputedStyle(document.getElementById('fixtureSearch')).display!=='none',fits,rotates:before!==after,slow:getComputedStyle(ball).animationDuration==='3s',stops:paused===stopped,belowCaption:line.top>document.getElementById('fixtureCaption').getBoundingClientRect().bottom,aligned,oneTimeline,restored:getComputedStyle(native).visibility!=='hidden'});
                                     }catch(error){window.overlayResults=JSON.stringify({error:String(error)});}
                                    })()
                                """.trimIndent(), null)
                                fun probe(attempt: Int) {
                                    view.evaluateJavascript("window.overlayResults || null") { value ->
                                        if (value != "null") { result.set(value); done.countDown() }
                                        else if (attempt < 60) view.postDelayed({ probe(attempt + 1) }, 150)
                                    }
                                }
                                view.postDelayed({ probe(0) }, 150)
                            }
                        }
                    }
                }
                web.loadDataWithBaseURL("https://fixture.invalid/", """
                    <!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1">
                    <body style="margin:0;height:100vh;background:#18212a;transform:translateY(-24px)">
                    <main style="position:fixed;top:0;right:0;bottom:0;left:0"><article><div><div>
                     <video id="fixtureVideo" style="position:absolute;top:35%;left:0;width:100%;height:28%"></video>
                    </div></div></article><p id="fixtureCaption" style="position:absolute;bottom:45px;color:white">Caption stays above the footer</p>
                     <input id="fixtureSeek" type="range" style="position:absolute;bottom:4px;left:12px;width:calc(100% - 24px);height:20px;margin:0">
                     <input id="fixtureVolume" type="range" aria-label="Volume" style="position:absolute;top:60px;left:12px;width:100px;height:20px;margin:0">
                    </main>
                    <aside style="position:fixed;top:0"><button id="fixtureCTA">فتح التطبيق</button><button id="fixtureSearch">Search</button></aside>
                    </body></html>
                """.trimIndent(), "text/html", "UTF-8", null)
            }
            assertTrue("Actual Chromium animation/layout fixture must complete", done.await(15, TimeUnit.SECONDS))
            val data = org.json.JSONObject(org.json.JSONArray("[${result.get()}]").getString(0))
            assertFalse("Fixture error: $data", data.has("error"))
            for (key in listOf("transparentReaction", "ctaHidden", "search", "rotates", "slow", "stops", "belowCaption", "aligned", "oneTimeline", "restored")) {
                assertTrue("$key failed: $data", data.getBoolean(key))
            }
            val fits = data.getJSONArray("fits")
            assertEquals(3, fits.length())
            for (i in 0 until fits.length()) assertTrue("Complete ball must fit at start/middle/end: $data", fits.getBoolean(i))
        }
    }
}
