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
    <!doctype html><html><head><meta name='viewport' content='width=device-width,initial-scale=1'><style>html,body{margin:0;overflow-anchor:none;scroll-behavior:auto}#spacer{height:700px}#post{height:350px;background:#def}button{width:140px;height:50px}</style></head><body>
    <article id='outer'><div id='feed'><div id='spacer'></div><div id='post' data-tracking-duration-id='post42' data-ft='{"top_level_post_id":"42"}'><a href='/posts/42'>Post</a><br><button id='comments'>Comments</button></div><div style='height:3000px'></div></div></article><div id='detail' style='display:none;height:2500px'>Post detail</div>
    </body></html>
   """.trimIndent(),"text/html","UTF-8",null)}
   Thread.sleep(1000)
   scenario.onActivity{a->find(a.window.decorView)!!.evaluateJavascript(a.assets.open("feed-return.js").bufferedReader().use{it.readText()}.replace("__CONFIG__","{rememberPosition:true}"),null)}
   js("""
    window.firstReturnTop=null;window.siteClicks=0;comments.addEventListener('pointerdown',()=>{siteClicks++;history.pushState({site:'untouched'},'', '/posts/42');feed.style.display='none';detail.style.display='block';scrollTo(0,0);});
    window.addEventListener('popstate',()=>{if(location.pathname==='/'){detail.style.display='none';const rebuilt=post.cloneNode(true);post.replaceWith(rebuilt);rebuilt.removeAttribute('data-ft');rebuilt.removeAttribute('data-tracking-duration-id');rebuilt.setAttribute('data-pagelet','FeedUnit_42');spacer.style.height='1300px';feed.style.display='block';requestAnimationFrame(()=>window.firstReturnTop=post.getBoundingClientRect().top);setTimeout(()=>spacer.style.height='1500px',450);}});
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
   val firstReturnTop=js("firstReturnTop").toDouble()
   assertEquals("First return frame uses the opened post, not a lower card",initialTop,firstReturnTop,4.0)
   val restoredTop=js("post.getBoundingClientRect().top").toDouble()
   assertEquals("Nearest source post survives early activation, new wrapper and late layout",initialTop,restoredTop,4.0)
   assertTrue(js("FproFeedReturn.report().corrections").toInt()>0)
   val y=js("scrollY").toDouble()
   down=android.os.SystemClock.uptimeMillis();touch(android.view.MotionEvent.ACTION_DOWN,down)
   js("spacer.style.height='1800px';true");Thread.sleep(450);touch(android.view.MotionEvent.ACTION_CANCEL,down)
   assertEquals("Trusted touch cancels automatic corrections",y,js("scrollY").toDouble(),4.0)
   assertEquals("false",js("FproFeedReturn.report().active"))
   assertTrue("Trusted gesture must cancel a live settling window",js("FproFeedReturn.report().cancelled").toInt()>0)
   android.util.Log.i("FPRO_FEED_RETURN","initialTop=$initialTop firstReturnTop=$firstReturnTop restoredTop=$restoredTop y=$y "+js("JSON.stringify(FproFeedReturn.report())"))
  }
 }
 @Test fun nativeBackDoesNotConsumeFirstPressScrollingDetailToTop() {
  val inst=InstrumentationRegistry.getInstrumentation()
  ActivityScenario.launch<MainActivity>(android.content.Intent(inst.targetContext,MainActivity::class.java)).use { scenario ->
   awaitBrowserReady(scenario);Thread.sleep(2300)
   fun js(code:String):String {val done=CountDownLatch(1);val value=AtomicReference("");scenario.onActivity{a->find(a.window.decorView)!!.evaluateJavascript(code){value.set(it);done.countDown()}};assertTrue(done.await(10,TimeUnit.SECONDS));return value.get()}
   scenario.onActivity{a->find(a.window.decorView)!!.loadDataWithBaseURL("https://m.facebook.com/","<html><meta name='viewport' content='width=device-width,initial-scale=1'><body style='height:6000px'>Opaque detail without a recognised post identifier</body></html>","text/html","UTF-8",null)}
   Thread.sleep(1000)
   js("history.pushState({site:true},'', '/posts/opaque');scrollTo(0,800);true")
   Thread.sleep(200);assertTrue(js("scrollY").toDouble()>80)
   val started=android.os.SystemClock.elapsedRealtime()
   inst.sendKeyDownUpSync(android.view.KeyEvent.KEYCODE_BACK)
   var returned=false
   while(!returned&&android.os.SystemClock.elapsedRealtime()-started<1500){returned=js("location.pathname==='/'")=="true";if(!returned)Thread.sleep(30)}
   assertTrue("One real Back must navigate, not consume a press with smooth scroll-to-top",returned)
   android.util.Log.i("FPRO_FEED_RETURN","nativeBackMs="+(android.os.SystemClock.elapsedRealtime()-started))
  }
 }

 @Test fun siteArrowRestoresPostWhenReplacingHomeTrackingRoute() {
  val inst=InstrumentationRegistry.getInstrumentation()
  ActivityScenario.launch<MainActivity>(android.content.Intent(inst.targetContext,MainActivity::class.java)).use { scenario ->
   awaitBrowserReady(scenario);Thread.sleep(2300)
   fun js(code:String):String {val done=CountDownLatch(1);val value=AtomicReference("");scenario.onActivity{a->find(a.window.decorView)!!.evaluateJavascript(code){value.set(it);done.countDown()}};assertTrue(done.await(10,TimeUnit.SECONDS));return value.get()}
   scenario.onActivity{a->find(a.window.decorView)!!.loadDataWithBaseURL("https://m.facebook.com/?ref=feed","""
    <!doctype html><meta name='viewport' content='width=device-width,initial-scale=1'>
    <style>body{margin:0;overflow-anchor:none}button{width:160px;height:50px}#spacer{height:700px}</style>
    <main id='feed'><div id='spacer'></div><article id='post' data-ft='{"top_level_post_id":"42"}' style='height:350px'><a href='/posts/42'>Post</a><br><button id='comments'>Comments</button></article><div style='height:3000px'></div></main>
    <section id='detail' style='display:none;height:2400px'><button id='arrow' aria-label='رجوع' style='position:fixed;left:0;top:0'>Back</button></section>
    <script>
    comments.onclick=()=>{history.pushState({site:'detail'},'', '/posts/42');feed.style.display='none';detail.style.display='block';scrollTo(0,0);};
    arrow.onclick=()=>{detail.style.display='none';spacer.style.height='1300px';feed.style.display='block';history.replaceState({site:'arrow'},'', '/?ref=arrow');};
    </script>
   """.trimIndent(),"text/html","UTF-8",null)}
   Thread.sleep(1200)
   js("scrollTo(0,600);true");Thread.sleep(150)
   val before=js("post.getBoundingClientRect().top").toDouble()
   fun tap(id:String){
    val r=org.json.JSONObject(js("(()=>{const r=document.getElementById('$id').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};})()"))
    val point=FloatArray(2);scenario.onActivity{a->val w=find(a.window.decorView)!!;val loc=IntArray(2);w.getLocationOnScreen(loc);point[0]=loc[0]+r.getDouble("x").toFloat()*w.resources.displayMetrics.density;point[1]=loc[1]+r.getDouble("y").toFloat()*w.resources.displayMetrics.density}
    val down=android.os.SystemClock.uptimeMillis()
    for(kind in listOf(android.view.MotionEvent.ACTION_DOWN,android.view.MotionEvent.ACTION_UP)){val e=android.view.MotionEvent.obtain(down,android.os.SystemClock.uptimeMillis(),kind,point[0],point[1],0);e.source=android.view.InputDevice.SOURCE_TOUCHSCREEN;assertTrue(inst.uiAutomation.injectInputEvent(e,true));e.recycle()}
   }
   tap("comments");Thread.sleep(200);assertEquals("true",js("location.pathname==='/posts/42'&&FproFeedReturn.canReturn()"))
   val started=android.os.SystemClock.elapsedRealtime();tap("arrow")
   var correct=false
   while(!correct&&android.os.SystemClock.elapsedRealtime()-started<1500){correct=js("location.search==='?ref=arrow'&&Math.abs(post.getBoundingClientRect().top-$before)<4")=="true";if(!correct)Thread.sleep(30)}
   assertTrue("Trusted site arrow returns to source post despite replaceState and tracking change",correct)
   assertEquals("arrow",js("history.state.site").trim('"'))
   android.util.Log.i("FPRO_FEED_RETURN","siteArrowMs="+(android.os.SystemClock.elapsedRealtime()-started)+" top="+js("post.getBoundingClientRect().top"))
  }
 }

 @Test fun collapsedSourcePostRemainsVisibleInsteadOfRestoringImpossibleOffset() {
  val inst=InstrumentationRegistry.getInstrumentation()
  ActivityScenario.launch<MainActivity>(android.content.Intent(inst.targetContext,MainActivity::class.java)).use { scenario ->
   awaitBrowserReady(scenario);Thread.sleep(2300)
   fun js(code:String):String {val done=CountDownLatch(1);val value=AtomicReference("");scenario.onActivity{a->find(a.window.decorView)!!.evaluateJavascript(code){value.set(it);done.countDown()}};assertTrue(done.await(10,TimeUnit.SECONDS));return value.get()}
   scenario.onActivity{a->find(a.window.decorView)!!.loadDataWithBaseURL("https://m.facebook.com/","""
    <!doctype html><meta name='viewport' content='width=device-width,initial-scale=1'>
    <style>body{margin:0;overflow-anchor:none}#post{position:relative;height:1800px}#comments{position:absolute;top:800px;left:0;width:160px;height:50px}</style>
    <main id='feed'><div style='height:700px'></div><article id='post' data-ft='{"top_level_post_id":"42"}'><a href='/posts/42'>Source</a><button id='comments'>Comments</button></article><div style='height:3000px'>Later posts</div></main>
    <div id='detail' style='height:2400px;display:none'>Detail</div>
    <script>
    comments.onclick=()=>{history.pushState({site:true},'', '/posts/42');feed.style.display='none';detail.style.display='block';scrollTo(0,0);};
    addEventListener('popstate',()=>{detail.style.display='none';post.style.height='250px';comments.style.display='none';feed.style.display='block';});
    </script>
   """.trimIndent(),"text/html","UTF-8",null)}
   Thread.sleep(1200);js("scrollTo(0,1400);true");Thread.sleep(150)
   assertTrue("Source begins above viewport while comments are visible",js("post.getBoundingClientRect().top").toDouble()< -600)
   val xy=FloatArray(2);scenario.onActivity{a->val w=find(a.window.decorView)!!;val loc=IntArray(2);w.getLocationOnScreen(loc);xy[0]=loc[0]+80*w.resources.displayMetrics.density;xy[1]=loc[1]+125*w.resources.displayMetrics.density}
   val down=android.os.SystemClock.uptimeMillis()
   for(kind in listOf(android.view.MotionEvent.ACTION_DOWN,android.view.MotionEvent.ACTION_UP)){val e=android.view.MotionEvent.obtain(down,android.os.SystemClock.uptimeMillis(),kind,xy[0],xy[1],0);e.source=android.view.InputDevice.SOURCE_TOUCHSCREEN;assertTrue(inst.uiAutomation.injectInputEvent(e,true));e.recycle()}
   Thread.sleep(200);assertEquals("true",js("location.pathname==='/posts/42'&&FproFeedReturn.canReturn()"))
   inst.sendKeyDownUpSync(android.view.KeyEvent.KEYCODE_BACK)
   val started=android.os.SystemClock.elapsedRealtime();var visible=false
   while(!visible&&android.os.SystemClock.elapsedRealtime()-started<1500){visible=js("location.pathname==='/'&&Math.abs(post.getBoundingClientRect().top)<4&&post.getBoundingClientRect().bottom>0")=="true";if(!visible)Thread.sleep(30)}
   assertTrue("Return must show source, not later cards after its height shrank",visible)
   android.util.Log.i("FPRO_FEED_RETURN","collapsedSourceTop="+js("post.getBoundingClientRect().top"))
  }
 }

}
