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

@RunWith(AndroidJUnit4::class)
class DisplaySurfaceRegressionTest {
 private fun find(v:View):WebView?{if(v is WebView)return v;if(v is ViewGroup)for(i in 0 until v.childCount)find(v.getChildAt(i))?.let{return it};return null}
 @Test fun localSurfaceKeepsOriginalDocumentAndReleasesOnBackAndDestroy() {
  val inst=InstrumentationRegistry.getInstrumentation()
  val scenario=ActivityScenario.launch<MainActivity>(android.content.Intent().setClassName(inst.targetContext.packageName,"com.almekhlafi.FPRO.MainActivity"))
  var owner:MainActivity?=null
  val field=MainActivity::class.java.getDeclaredField("displayTestDialog").apply{isAccessible=true}
  val show=MainActivity::class.java.getDeclaredMethod("showDisplayTest").apply{isAccessible=true}
  try{
   awaitBrowserReady(scenario);Thread.sleep(2300)
   fun js(code:String):String{val latch=CountDownLatch(1);val result=AtomicReference("");scenario.onActivity{a->find(a.window.decorView)!!.evaluateJavascript(code){result.set(it);latch.countDown()}};assertTrue(latch.await(15,TimeUnit.SECONDS));return result.get()}
   var original:WebView?=null
   scenario.onActivity{a->owner=a;original=find(a.window.decorView)!!;original!!.loadDataWithBaseURL("https://fixture.invalid/original","<!doctype html><p>Original browser document must remain intact during offline diagnostics.</p>","text/html","UTF-8",null)}
   Thread.sleep(700)
   js("window.diagnosticSourceToken='kept';true")
   val before=js("location.href+'|'+history.length")
   scenario.onActivity{a->show.invoke(a);val dialog=field.get(a) as android.app.Dialog;assertTrue(dialog.isShowing);assertNotSame(original,find(dialog.window!!.decorView));assertSame(original,find(a.window.decorView))}
   Thread.sleep(300)
   inst.sendKeyDownUpSync(android.view.KeyEvent.KEYCODE_BACK);Thread.sleep(200)
   scenario.onActivity{a->assertNull("Back dismisses and releases local surface",field.get(a));assertSame(original,find(a.window.decorView))}
   assertEquals("Original document survives","\"kept\"",js("diagnosticSourceToken"))
   assertEquals("No main-browser navigation/history replacement",before,js("location.href+'|'+history.length"))
   scenario.onActivity{a->show.invoke(a);assertNotNull(field.get(a))}
  }finally{scenario.close()}
  assertNull("Activity destruction releases the diagnostic window",field.get(owner))
  android.util.Log.i("FPRO_REELS_VIEWER","display-surface: original document kept; Back and destroy released diagnostic window")
 }
}
