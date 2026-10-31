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

/** Android history-back and trusted touch on a synthetic feed, not an account. */
@RunWith(AndroidJUnit4::class)
class FeedReturnRegressionTest {
 private fun find(v:View):WebView? {if(v is WebView)return v;if(v is ViewGroup)for(i in 0 until v.childCount)find(v.getChildAt(i))?.let{return it};return null}
 @Test fun openedPostKeepsViewportOffsetAfterNativeBackAndLateLayout() {
  val inst=InstrumentationRegistry.getInstrumentation()
  ActivityScenario.launch<MainActivity>(android.content.Intent().setClassName(inst.targetContext.packageName,"com.almekhlafi.FPRO.MainActivity")).use { scenario ->
   awaitBrowserReady(scenario);Thread.sleep(2300)
   fun js(code:String):String {val latch=CountDownLatch(1);val result=AtomicReference("");scenario.onActivity{a->find(a.window.decorView)!!.evaluateJavascript(code){result.set(it);latch.countDown()}};assertTrue("JS finished",latch.await(15,TimeUnit.SECONDS));return result.get()}
   scenario.onActivity{a->find(a.window.decorView)!!.loadDataWithBaseURL("https://m.facebook.com/","""
    <!doctype html><html><head><meta name='viewport' content='width=device-width,initial-scale=1'><style>html,body{margin:0;overflow-anchor:none;scroll-behavior:auto}#spacer{height:700px}article{height:350px;background:#def}button{width:140px;height:50px}</style></head><body>
    <div id='feed'><div id='spacer'></div><article id='post' data-tracking-duration-id='post42'><a href='/posts/42'>Post</a><br><button id='comments'>Comments</button></article><div style='height:3000px'></div></div><div id='detail' style='display:none;height:2500px'>Post detail</div>
    </body></html>
   """.trimIndent(),"text/html","UTF-8",null)}
   Thread.sleep(1000)
   scenario.onActivity{a->find(a.window.decorView)!!.evaluateJavascript(a.assets.open("feed-return.js").bufferedReader().use{it.readText()}.replace("__CONFIG__","{rememberPosition:true}"),null)}
   js("""
    window.siteClicks=0;comments.addEventListener('click',()=>{siteClicks++;history.pushState({site:'untouched'},'', '/posts/42');feed.style.display='none';detail.style.display='block';scrollTo(0,0);});
    window.addEventListener('popstate',()=>{if(location.pathname==='/'){detail.style.display='none';spacer.style.height='1300px';feed.style.display='block';setTimeout(()=>spacer.style.height='1500px',450);}});
    scrollTo(0,600);true
   """.trimIndent());Thread.sleep(200)
   val initialTop=js("post.getBoundingClientRect().top").toDouble()
   val coords=org.json.JSONObject(js("(()=>{const r=comments.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};})()"))
   val xy=FloatArray(2);scenario.onActivity{a->val web=find(a.window.decorView)!!;val loc=IntArray(2);web.getLocationOnScreen(loc);xy[0]=loc[0]+coords.getDouble("x").toFloat()*web.resources.displayMetrics.density;xy[1]=loc[1]+coords.getDouble("y").toFloat()*web.resources.displayMetrics.density}
   fun touch(kind:Int,down:Long){val e=android.view.MotionEvent.obtain(down,android.os.SystemClock.uptimeMillis(),kind,xy[0],xy[1],0);e.source=android.view.InputDevice.SOURCE_TOUCHSCREEN;assertTrue(inst.uiAutomation.injectInputEvent(e,true));e.recycle()}
   var down=android.os.SystemClock.uptimeMillis();touch(android.view.MotionEvent.ACTION_DOWN,down);touch(android.view.MotionEvent.ACTION_UP,down);Thread.sleep(250)
   assertEquals("1",js("siteClicks"));assertEquals("true",js("location.pathname==='/posts/42'&&history.state.site==='untouched'&&FproFeedReturn.canReturn()"))
   // Exercise the Activity BackHandler, not a synthetic DOM event/history call.
   inst.sendKeyDownUpSync(android.view.KeyEvent.KEYCODE_BACK);Thread.sleep(900)
   assertEquals("true",js("location.pathname==='/'"))
   val restoredTop=js("post.getBoundingClientRect().top").toDouble()
   assertEquals("Original post offset survives changed heights and late layout",initialTop,restoredTop,4.0)
   assertTrue(js("FproFeedReturn.report().corrections").toInt()>0)
   val y=js("scrollY").toDouble()
   down=android.os.SystemClock.uptimeMillis();touch(android.view.MotionEvent.ACTION_DOWN,down)
   js("spacer.style.height='1800px';true");Thread.sleep(450);touch(android.view.MotionEvent.ACTION_CANCEL,down)
   assertEquals("Trusted touch cancels automatic corrections",y,js("scrollY").toDouble(),4.0)
   assertEquals("false",js("FproFeedReturn.report().active"))
   assertTrue("Trusted gesture must cancel a live settling window",js("FproFeedReturn.report().cancelled").toInt()>0)
   android.util.Log.i("FPRO_FEED_RETURN","initialTop=$initialTop restoredTop=$restoredTop y=$y "+js("JSON.stringify(FproFeedReturn.report())"))
  }
 }
}
