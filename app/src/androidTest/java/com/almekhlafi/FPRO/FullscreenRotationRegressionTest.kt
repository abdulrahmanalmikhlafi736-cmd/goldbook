package com.almekhlafi.FPRO

import android.content.Intent
import android.content.pm.ActivityInfo
import android.content.res.Configuration
import android.os.SystemClock
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

/** Responsive-site reproduction, real touches/fullscreen/rotation/video; no account claim. */
@RunWith(AndroidJUnit4::class)
class FullscreenRotationRegressionTest {
    private fun find(v: View): WebView? {
        if (v is WebView) return v
        if (v is ViewGroup) for (i in 0 until v.childCount) find(v.getChildAt(i))?.let { return it }
        return null
    }
    @Test fun doubleTapPlayerSurvivesLandscapeAndBackRestoresBrowsing() {
        val inst = InstrumentationRegistry.getInstrumentation()
        val clip = Base64.encodeToString(inst.context.assets.open("video-workload.mp4").use { it.readBytes() }, Base64.NO_WRAP)
        val field = MainActivity::class.java.getDeclaredField("fullView").apply { isAccessible = true }
        ActivityScenario.launch<MainActivity>(Intent(inst.targetContext, MainActivity::class.java)).use { scenario ->
            awaitBrowserReady(scenario); Thread.sleep(2300)
            fun js(code: String): String {
                val done = CountDownLatch(1); val result = AtomicReference("")
                scenario.onActivity { a -> find(a.window.decorView)!!.evaluateJavascript(code) { result.set(it); done.countDown() } }
                assertTrue("JavaScript callback", done.await(10, TimeUnit.SECONDS)); return result.get()
            }
            fun awaitState(label: String, predicate: (MainActivity) -> Boolean) {
                var ok = false
                val until = SystemClock.elapsedRealtime() + 12000
                while (!ok && SystemClock.elapsedRealtime() < until) {
                    scenario.onActivity { a -> ok = predicate(a) }; if (!ok) Thread.sleep(100)
                }
                var state=""
                if(!ok) scenario.onActivity { a -> state="orientation=${a.resources.configuration.orientation}, request=${a.requestedOrientation}, full=${field.get(a)!=null}" }
                assertTrue(label+"; "+state+if(!ok)js("JSON.stringify({remounts,wide:initialWide,w:innerWidth,h:innerHeight,fs:!!document.fullscreenElement,native:!!window.__fproNativeFullscreen,events:rotationTrace})")else "", ok)
            }
            val point = FloatArray(2)
            scenario.onActivity { a ->
                val w = find(a.window.decorView)!!
                val xy = IntArray(2); w.getLocationOnScreen(xy)
                point[0] = xy[0] + w.width / 2f; point[1] = xy[1] + w.height / 2f
                w.stopLoading()
                w.loadDataWithBaseURL("https://fixture.invalid/", """
                    <!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">
                    <body style="margin:0"><video id="player" muted loop playsinline preload="auto"
                    style="position:fixed;inset:0;width:100%;height:100%" src="data:video/mp4;base64,$clip"></video>
                    <div role="button" aria-label="Play" style="position:fixed;inset:0"></div>
                    <script>
                    window.token='same-document';window.remounts=0;window.initialWide=innerWidth>innerHeight;
                    window.rotationTrace=[];
                    for(const name of ['resize','orientationchange','fullscreenchange'])addEventListener(name,()=>rotationTrace.push({event:name,w:innerWidth,h:innerHeight,fs:!!document.fullscreenElement,native:!!window.__fproNativeFullscreen}),true);
                    document.addEventListener('pointerup',()=>player.play().catch(()=>{}),true);
                    // Responsive SPA behaviour: crossing a layout breakpoint replaces its player.
                    addEventListener('resize',()=>{
                      if((innerWidth>innerHeight)!==initialWide){
                        remounts++;initialWide=innerWidth>innerHeight;
                        const old=document.getElementById('player');old.replaceWith(old.cloneNode(true));
                      }
                    });
                    </script>
                """.trimIndent(), "text/html", "UTF-8", null)
            }
            Thread.sleep(1500)
            scenario.onActivity { a ->
                val source = a.assets.open("facebook.js").bufferedReader().use { it.readText() }
                    .replace("__CONFIG__", "{\"enhance\":false,\"doubleTapFullscreen\":true,\"downloads\":false,\"rainbow\":false}")
                find(a.window.decorView)!!.evaluateJavascript(source + ";player.play().catch(()=>{});", null)
            }
            repeat(2) {
                val down = SystemClock.uptimeMillis()
                for (kind in listOf(android.view.MotionEvent.ACTION_DOWN, android.view.MotionEvent.ACTION_UP)) {
                    val e = android.view.MotionEvent.obtain(down, SystemClock.uptimeMillis(), kind, point[0], point[1], 0)
                    e.source = android.view.InputDevice.SOURCE_TOUCHSCREEN
                    assertTrue(inst.uiAutomation.injectInputEvent(e, true)); e.recycle(); Thread.sleep(50)
                }
                if (it == 0) Thread.sleep(70)
            }
            awaitState("Trusted double tap enters real fullscreen") { field.get(it) != null }
            scenario.onActivity { a ->
                assertEquals(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT, a.requestedOrientation)
                // Exercise production turn gate. Emulator window rotation below is forced,
                // not presented as physical accelerometer evidence.
                a.onFullscreenOrientation(0); a.onFullscreenOrientation(90)
                assertEquals(ActivityInfo.SCREEN_ORIENTATION_SENSOR, a.requestedOrientation)
                a.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
            }
            awaitState("Actual landscape window") { it.resources.configuration.orientation == Configuration.ORIENTATION_LANDSCAPE }
            Thread.sleep(1400)
            scenario.onActivity { a ->
                val full = field.get(a) as? View
                assertNotNull("Responsive resize must not exit the native player", full)
                assertTrue("Fullscreen fills landscape", full!!.width > full.height)
            }
            assertEquals("No underlying responsive remount during fullscreen", "0", js("remounts"))
            assertEquals("Same playing video survives", "true", js("token==='same-document'&&!player.paused&&player.readyState>=2"))
            val frames = js("player.getVideoPlaybackQuality().totalVideoFrames").toInt()
            Thread.sleep(700)
            assertTrue("Frames continue in landscape", js("player.getVideoPlaybackQuality().totalVideoFrames").toInt() > frames)
            android.os.ParcelFileDescriptor.AutoCloseInputStream(inst.uiAutomation.executeShellCommand("input keyevent KEYCODE_BACK")).use { it.readBytes() }
            awaitState("Back exits fullscreen and restores portrait") {
                field.get(it) == null && it.resources.configuration.orientation == Configuration.ORIENTATION_PORTRAIT &&
                    find(it.window.decorView)!!.height > find(it.window.decorView)!!.width
            }
            assertEquals("Back keeps document", "true", js("token==='same-document'"))
            android.util.Log.i("FPRO_ROTATION", "PASS: trusted double tap; real landscape custom view; continuing frames; no responsive remount; Back restores portrait")
        }
    }
}
